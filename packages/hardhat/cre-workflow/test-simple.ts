import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";

const onTrigger = async (runtime: Runtime<any>, payload: any) => {
    runtime.log("Triggered!");
    return "OK";
};

const initWorkflow = (config: any) => {
    return [
        cre.handler(
            { id: "test-trigger", outputSchema: () => ({ $typeName: "values.v1.Value" }), adapt: (p: any) => p },
            onTrigger
        ),
    ];
};

export async function main() {
    const runner = await Runner.newRunner<any>({ configSchema: {} as any });
    await runner.run(initWorkflow);
}
main();
