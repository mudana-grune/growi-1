type commandPermission = { [key:string]: string[] | boolean }

export const checkPermission = (
    commandPermission:commandPermission, commandOrActionIdOrCallbackId:string, fromChannel:string,
):boolean => {
  let isPermitted = false;

  Object.entries(commandPermission).forEach((entry) => {
    const [command, value] = entry;
    const permission = value;
    const commandRegExp = new RegExp(`(^${command}$)|(^${command}:\\w+)`);

    if (!commandRegExp.test(commandOrActionIdOrCallbackId)) return;

    // permission check
    if (permission === true) {
      isPermitted = true;
      return;
    }
    if (Array.isArray(permission) && permission.includes(fromChannel)) {
      isPermitted = true;
      return;
    }
  });

  return isPermitted;
};
