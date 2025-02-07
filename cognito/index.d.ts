import { Construct } from 'constructs';
export interface CognitoPoolProps {
    readonly stage: string;
}
export declare class CognitoPool extends Construct {
    constructor(scope: Construct, id: string, props: CognitoPoolProps);
}
