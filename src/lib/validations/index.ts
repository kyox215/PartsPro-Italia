import { z } from "zod";

export const localeSchema = z.enum(["it", "en", "zh"]);

export { authCredentialsSchema } from "./auth";
export type { AuthCredentialsInput } from "./auth";
