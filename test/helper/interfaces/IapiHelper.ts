import * as Promise from 'bluebird';
import { ConfigLoader } from '../../lib/config-loader';

interface IReqOptions {
    protocol?: string;
    hostname?: string;
    port?: number;
    queryString?: boolean;
    method?: string;
    path?: string;
    headers?: {};
    jsonBody?: {};
}
export {IReqOptions }


interface IApiHelper {

    config: ConfigLoader;
    reqOptions: IReqOptions;

    sendRequest(requestBody?:any):Promise<any>

}
export  {IApiHelper}