/// <reference lib="webworker" />
import type { PipelineRequest } from "@/types";
import { executePipelineRequest } from "./pipeline-core";

self.addEventListener("message", (event: MessageEvent<PipelineRequest>) => {
  void executePipelineRequest(event.data).then((response) => self.postMessage(response));
});

export {};
