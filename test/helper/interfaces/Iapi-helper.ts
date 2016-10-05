import * as Promise from 'bluebird';
import { ConfigLoader } from '../../lib/config-loader';

interface IApiHelper {

    config: ConfigLoader;
    reqOptions: IReqOptions;
    queryString: Boolean;
    protocol?: string;

    sendRequest(requestBody?: any): Promise<any>;

}
export  { IApiHelper }
