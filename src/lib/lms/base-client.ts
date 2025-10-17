/**
 * Base LMS Client - Core functionality
 */

export interface LmsEnvironment {
    dmn: string;
    host: string;
    headers: Record<string, any>;
    base_params: Record<string, any>;
    user_code: string;
    pass_master: string;
    pass_root?: string;
}

export interface LmsLoginResult {
    token: string;
    iid: number;
    id: string;
    user_organizations?: number[];
}

export interface LmsSendOptions {
    path: string;
    payload?: Record<string, any>;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    dmn?: string;
    user?: string;
    pass?: string;
}

export interface LmsRequestHistory {
    method: string;
    url: string;
    payload: Record<string, any>;
    statusCode: number;
    responseTime: number;
    response: any;
    timestamp: string;
}

export interface LmsSendResult {
    success: boolean;
    data?: any;
    error?: string;
    requestHistory: LmsRequestHistory[];
}

export class LmsBaseClient {
    protected env: LmsEnvironment;
    protected token: string | null = null;
    protected baseParams: Record<string, any> = {};
    protected requestHistory: LmsRequestHistory[] = [];

    constructor(environment: LmsEnvironment) {
        this.env = environment;
        this.baseParams = {
            _sand_domain: environment.dmn,
            ...environment.base_params,
        };
    }

    /**
     * Add request to history
     */
    protected addToHistory(
        method: string,
        url: string,
        payload: Record<string, any>,
        statusCode: number,
        responseTime: number,
        response: any
    ): void {
        this.requestHistory.push({
            method,
            url,
            payload,
            statusCode,
            responseTime,
            response,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Login to LMS and get token
     */
    async login(user?: string, pass?: string): Promise<LmsLoginResult> {
        const loginUrl = "/user/login";
        const fullUrl = `${this.env.host}${loginUrl}`;
        
        // Determine which credentials to use
        const loginUser = user || this.env.user_code;
        const loginPass = pass || (user === "root" ? this.env.pass_root : this.env.pass_master);

        const payload = {
            lname: loginUser,
            pass: loginPass,
        };

        console.log("[LmsClient] Logging in...", {
            host: this.env.host,
            user: loginUser,
        });

        const requestPayload = {
            ...payload,
            ...this.baseParams,
        };

        const startTime = Date.now();

        try {
            const response = await fetch(fullUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    ...this.env.headers,
                },
                body: this.encodeFormData(requestPayload),
            });

            const responseTime = Date.now() - startTime;
            const statusCode = response.status;

            if (!response.ok) {
                const errorText = await response.text();
                this.addToHistory(
                    "POST",
                    fullUrl,
                    requestPayload,
                    statusCode,
                    responseTime,
                    { error: errorText }
                );
                throw new Error(`HTTP ${statusCode}: ${response.statusText}`);
            }

            const data = await response.json();
            const result = data.result;

            // Add login request to history
            this.addToHistory(
                "POST",
                fullUrl,
                requestPayload,
                statusCode,
                responseTime,
                data
            );

            if (!result || !result.token) {
                throw new Error("Login failed: No token received");
            }

            // Store token and update base params
            this.token = result.token;
            this.baseParams = {
                ...this.baseParams,
                _sand_token: result.token,
                _sand_uiid: result.iid,
                _sand_uid: result.id,
            };

            console.log("[LmsClient] Login successful", {
                responseTime: `${responseTime}ms`,
                token: result.token.substring(0, 20) + "...",
            });

            return {
                token: result.token,
                iid: result.iid,
                id: result.id,
                user_organizations: result.user_organizations,
            };
        } catch (error) {
            console.error("[LmsClient] Login failed:", error);
            throw error;
        }
    }

    /**
     * Send API request with auto-login if needed
     */
    async send(options: LmsSendOptions): Promise<LmsSendResult> {
        const { path, payload = {}, method = "POST", dmn, user, pass } = options;

        // Clear history before new request
        this.requestHistory = [];

        // Auto-login if no token
        if (!this.token) {
            console.log("[LmsClient] No token found, performing auto-login...");
            try {
                await this.login(user, pass);
            } catch (error) {
                return {
                    success: false,
                    error: `Auto-login failed: ${error instanceof Error ? error.message : String(error)}`,
                    requestHistory: this.requestHistory,
                };
            }
        }

        // Build request params
        const requestParams = {
            ...this.baseParams,
            ...payload,
        };

        // Override dmn if provided
        if (dmn) {
            requestParams._sand_domain = dmn;
        }

        const url = `${this.env.host}${path}`;
        const startTime = Date.now();

        console.log("[LmsClient] Sending request:", {
            method,
            path,
            dmn: requestParams._sand_domain,
        });

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    ...this.env.headers,
                },
                body: method !== "GET" ? this.encodeFormData(requestParams) : undefined,
            });

            const responseTime = Date.now() - startTime;
            const statusCode = response.status;

            if (!response.ok) {
                const errorText = await response.text();
                this.addToHistory(
                    method,
                    url,
                    requestParams,
                    statusCode,
                    responseTime,
                    { error: errorText }
                );

                return {
                    success: false,
                    error: `HTTP ${statusCode}: ${response.statusText}`,
                    requestHistory: this.requestHistory,
                };
            }

            const data = await response.json();

            // Add main request to history
            this.addToHistory(
                method,
                url,
                requestParams,
                statusCode,
                responseTime,
                data
            );

            console.log("[LmsClient] Request successful", {
                responseTime: `${responseTime}ms`,
                statusCode,
            });

            return {
                success: true,
                data: data,
                requestHistory: this.requestHistory,
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error("[LmsClient] Request failed:", error);

            this.addToHistory(
                method,
                url,
                requestParams,
                0,
                responseTime,
                { error: error instanceof Error ? error.message : String(error) }
            );

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                requestHistory: this.requestHistory,
            };
        }
    }

    /**
     * Encode object to form-urlencoded format
     */
    protected encodeFormData(data: Record<string, any>): string {
        const flattened = this.flattenPayload(data);
        return new URLSearchParams(flattened).toString();
    }

    /**
     * Flatten nested objects to form-urlencoded format
     * Example: { user: { name: "John" } } => { "user[name]": "John" }
     */
    protected flattenPayload(
        obj: Record<string, any>,
        prefix: string = ""
    ): Record<string, string> {
        const result: Record<string, string> = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}[${key}]` : key;

                if (value === null || value === undefined) {
                    continue;
                } else if (typeof value === "object" && !Array.isArray(value)) {
                    Object.assign(result, this.flattenPayload(value, newKey));
                } else if (Array.isArray(value)) {
                    value.forEach((item, index) => {
                        if (typeof item === "object") {
                            Object.assign(
                                result,
                                this.flattenPayload(item, `${newKey}[${index}]`)
                            );
                        } else {
                            result[`${newKey}[${index}]`] = String(item);
                        }
                    });
                } else {
                    result[newKey] = String(value);
                }
            }
        }

        return result;
    }

    /**
     * Get current token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * Check if logged in
     */
    isLoggedIn(): boolean {
        return this.token !== null;
    }

    /**
     * Clear session
     */
    logout(): void {
        this.token = null;
        this.baseParams = {
            _sand_domain: this.env.dmn,
            ...this.env.base_params,
        };
    }

    /**
     * Get request history
     */
    getRequestHistory(): LmsRequestHistory[] {
        return this.requestHistory;
    }
}
