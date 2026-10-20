import { registerDecorator, ValidationOptions } from 'class-validator';

export const VIETNAM_PHONE_REGEX = /^(0[0-9]{9}|\+84[0-9]{9})$/;

export function isValidPhoneNumber(phone?: string | null): boolean {
  return typeof phone === 'string' && VIETNAM_PHONE_REGEX.test(phone);
}

export function IsPhoneNumber(
  message: string = 'PHONE_INVALID_FORMAT',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) {
            return true;
          }
          return typeof value === 'string' && isValidPhoneNumber(value);
        },
        defaultMessage() {
          return message;
        },
      },
    });
  };
}
