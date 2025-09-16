import { CCCValidator } from './ccc';

export const validators = [
  { packageName: '@ckb-ccc/core', validatorClass: CCCValidator },
];

export const SDK_PACKAGE_NAMES = validators.map((v) => v.packageName);
