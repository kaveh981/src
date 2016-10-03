import * as Promise from 'bluebird';
import { ConfigLoader } from '../../lib/config-loader';

interface IReqOptions {
    hostname?: string;
    port?: number;
    method?: string;
    path?: string;
    headers?: {};
    json?: {};
}
export { IReqOptions }

interface IApiHelper {

    config: ConfigLoader;
    reqOptions: IReqOptions;
    queryString: Boolean;
    protocol?: string;

    sendRequest(requestBody?: any): Promise<any>;

}
export  {IApiHelper}
