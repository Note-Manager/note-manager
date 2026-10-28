import {parentPort, workerData} from "node:worker_threads";
import {WorkerRequest} from "../domain/FindInFiles";
import {runFileSearch} from "../utils/FileSearch";

let isCancelled = false;

parentPort?.on("message", () => isCancelled = true);

void runFileSearch(workerData as WorkerRequest, progress => parentPort?.postMessage(progress), () => isCancelled);
