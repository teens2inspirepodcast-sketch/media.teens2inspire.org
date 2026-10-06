const keyPattern = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*[\\\u0000-\u001f])[A-Za-z0-9._/-]+$/;

export function isSafeR2Key(value: string): boolean {
  return value.length <= 1024 && keyPattern.test(value);
}
