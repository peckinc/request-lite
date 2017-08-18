export default function request(options: {
    url: string;
    method: string;
    headers?: any;
    json?: boolean;
    body?: any;
    timeout?: number;
    retries?: number;
}): Promise<{
    statusCode: number;
    data: any;
}>;
