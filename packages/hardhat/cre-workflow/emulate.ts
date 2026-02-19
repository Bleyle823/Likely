// emulate.ts
import { main } from "./main";
import fs from "fs";
import { Buffer } from "buffer";
import yaml from "js-yaml";
import process from "process";
import { create, toBinary, fromBinary } from "@bufbuild/protobuf";
import * as PB from "@chainlink/cre-sdk/pb";
import { keccak256, toHex, encodeAbiParameters, parseAbiParameters } from "viem";

const isTrigger = process.argv.includes("--trigger");

// Mock globals required by CRE SDK WASM/Host environment
(globalThis as any).switchModes = (mode: any) => console.log(`[Mock] switchModes(${mode})`);
(globalThis as any).log = (msg: any) => console.log(`[Mock Log] ${msg}`);
(globalThis as any).sendResponse = (data: Uint8Array) => {
    console.log(`[Mock] sendResponse (size: ${data.length} bytes)`);
    try {
        const result = fromBinary(PB.SDK_PB.ExecutionResultSchema, data);
        console.log(`[Mock] Execution Result:`, JSON.stringify(result, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    } catch (e) {
        console.log(`[Mock] Could not decode result`);
    }
    return 0;
};
(globalThis as any).versionV2 = () => { };

// Capability mocking state
(globalThis as any).callCapability = (dataRaw: Uint8Array) => {
    try {
        const req = fromBinary(PB.SDK_PB.CapabilityRequestSchema, dataRaw);
        console.log(`[Mock] callCapability: id=${req.id}, method=${req.method}, callbackId=${req.callbackId}`);
        return req.callbackId;
    } catch (e) { return 0; }
};

(globalThis as any).awaitCapabilities = (requestRaw: Uint8Array, timeout: number) => {
    let ids: number[] = [];
    try {
        const request = fromBinary(PB.SDK_PB.AwaitCapabilitiesRequestSchema, requestRaw);
        ids = request.ids;
    } catch (e) { }

    console.log(`[Mock] awaitCapabilities: ids=[${ids.join(", ")}]`);
    const responsesMap: Record<string, any> = {};
    for (const hId of ids) {
        let payloadB: Uint8Array = new Uint8Array();
        let typeUrl = "";

        if (hId === -1 || hId === -2) { // Allow for some negative ids
            const httpResponse = create(PB.HTTP_CLIENT_PB.ResponseSchema, {
                statusCode: 200,
                body: new Uint8Array(Buffer.from(JSON.stringify({
                    candidates: [{
                        content: { parts: [{ text: JSON.stringify({ result: "YES", confidence: 9500 }) }] }
                    }]
                })))
            });
            payloadB = toBinary(PB.HTTP_CLIENT_PB.ResponseSchema, httpResponse);
            typeUrl = "type.googleapis.com/networking.http.v1alpha.Response";
        } else if (hId === 0 || hId === 1) { // hId 0 might be triggered by Simple consensus if starting at 0
            const responseBody = new Uint8Array(Buffer.from(JSON.stringify({
                candidates: [{
                    content: { parts: [{ text: JSON.stringify({ result: "YES", confidence: 9500 }) }] }
                }]
            })));

            const val = create(PB.VALUES_PB.ValueSchema, {
                value: {
                    case: "mapValue",
                    value: {
                        fields: {
                            statusCode: create(PB.VALUES_PB.ValueSchema, { value: { case: "float64Value", value: 200 } }),
                            body: create(PB.VALUES_PB.ValueSchema, { value: { case: "bytesValue", value: responseBody } }),
                            headers: create(PB.VALUES_PB.ValueSchema, { value: { case: "mapValue", value: { fields: {} } } })
                        }
                    }
                }
            });
            payloadB = toBinary(PB.VALUES_PB.ValueSchema, val);
            typeUrl = "type.googleapis.com/values.v1.Value";
        } else if (hId === 2) {
            const reportResp = create(PB.SDK_PB.ReportResponseSchema, {
                configDigest: new Uint8Array(32),
                seqNr: 1n,
                reportContext: new Uint8Array(32),
                rawReport: new Uint8Array(Buffer.from("mock_signed_report_data")),
                sigs: [new Uint8Array(Buffer.from("mock_signature"))]
            });
            payloadB = toBinary(PB.SDK_PB.ReportResponseSchema, reportResp);
            typeUrl = "type.googleapis.com/sdk.v1alpha.ReportResponse";
        } else {
            const evmReply = create(PB.EVM_PB.WriteReportReplySchema, {
                txHash: new Uint8Array(Buffer.from("1234567812345678123456781234567812345678123456781234567812345678", "hex"))
            });
            payloadB = toBinary(PB.EVM_PB.WriteReportReplySchema, evmReply);
            typeUrl = "type.googleapis.com/capabilities.blockchain.evm.v1alpha.WriteReportReply";
        }

        const anyMsg = { $typeName: "google.protobuf.Any", typeUrl, value: payloadB };
        responsesMap[`${hId}`] = { response: { case: "payload", value: anyMsg } };
    }
    return toBinary(PB.SDK_PB.AwaitCapabilitiesResponseSchema, create(PB.SDK_PB.AwaitCapabilitiesResponseSchema, { responses: responsesMap }));
};

(globalThis as any).now = () => Date.now();

// Mock secrets
(globalThis as any).getSecrets = () => true;
(globalThis as any).awaitSecrets = (requestRaw: Uint8Array) => {
    const request = fromBinary(PB.SDK_PB.AwaitSecretsRequestSchema, requestRaw);
    const secrets = yaml.load(fs.readFileSync("./secrets.yaml", "utf-8")) as any;
    const responsesMap: Record<string, any> = {};
    for (const sId of request.ids) {
        responsesMap[`${sId}`] = create(PB.SDK_PB.SecretResponsesSchema, {
            responses: [{
                response: {
                    case: "secret",
                    value: create(PB.SDK_PB.SecretSchema, {
                        id: "GEMINI_API_KEY",
                        value: secrets["GEMINI_API_KEY"] || ""
                    })
                }
            }]
        });
    }
    return toBinary(PB.SDK_PB.AwaitSecretsResponseSchema, create(PB.SDK_PB.AwaitSecretsResponseSchema, { responses: responsesMap }));
};

(globalThis as any).getWasiArgs = () => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
    let executeRequest: any;
    if (isTrigger) {
        console.log("[Emulate] Simulating trigger...");
        const eventSignature = "SettlementRequested(uint256,string)";
        const topic0 = keccak256(toHex(eventSignature));
        const topic1 = toHex(1n, { size: 32 });
        const data = encodeAbiParameters(parseAbiParameters("string"), ["Will it rain in New York tomorrow?"]);
        const mockLog = create(PB.EVM_PB.LogSchema, {
            address: new Uint8Array(Buffer.from(config.contractAddress.substring(2), "hex")),
            topics: [new Uint8Array(Buffer.from(topic0.substring(2), "hex")), new Uint8Array(Buffer.from(topic1.substring(2), "hex"))],
            data: new Uint8Array(Buffer.from(data.substring(2), "hex")),
        });
        const logAny = { $typeName: "google.protobuf.Any", typeUrl: "type.googleapis.com/capabilities.blockchain.evm.v1alpha.Log", value: toBinary(PB.EVM_PB.LogSchema, mockLog) };
        executeRequest = create(PB.SDK_PB.ExecuteRequestSchema, { config: new Uint8Array(Buffer.from(JSON.stringify(config))), request: { case: "trigger", value: { id: 0n, payload: logAny as any } } });
    } else {
        executeRequest = create(PB.SDK_PB.ExecuteRequestSchema, { config: new Uint8Array(Buffer.from(JSON.stringify(config))), request: { case: "subscribe", value: {} } });
    }
    return JSON.stringify(["main.js", Buffer.from(toBinary(PB.SDK_PB.ExecuteRequestSchema, executeRequest)).toString("base64")]);
};

console.log("Environment mocked. Starting main...");
main().catch(err => console.error("Main failed:", err));
