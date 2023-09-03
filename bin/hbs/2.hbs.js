module.exports = ['getLength', (args) => {
    if (!args) return;

    return args.length <= 0 ? '0' : args.length;
}, 'hasLength', (args) => {
    //temp
    return true;

    /*  TEMP
    if (!args) return;

    return args.length <= 0 ? false : true;
    */
}, 'isAdmin', (args) => {
    if (args == 2) {
        return true;
    } else {
        return false;
    }
}];

// /- hasLength (args: [STRING, LENGTH]) -/

// /- getLength (args: [STRING, ...]) -/