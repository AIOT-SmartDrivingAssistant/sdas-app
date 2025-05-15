const SystemErrors = {
    useContextError: "useUserContext must be used within a UserProvider.",
}

const InputErrors = {
    loginFormMissingField: "Please enter USERNAME and PASSWORD.",
}

const SuccessMessages = {
    auth: {
        login: "LOGIN successfully.",
        logout: "LOGOUT successfully.",
    },
    controlIot: {
        systemOn: "System turn ON successfully.",
        systemOff: "System turn OFF successfully.",
        controlService: "Control service successfully.",
    }
}

const ErrorMessages = {
    system: {
        useContextError: "useUserContext must be used within a UserProvider.",
    },
    input: {
        loginFormMissingField: "Please enter USERNAME and PASSWORD.",
    },
    auth: {
        login: "LOGIN fail: ",
        logout: "LOGOUT fail: "
    },
    iot: {
        toggle: "Toggle IoT system fail: ",
        controlService: "Control service fail: "
    }
}

export { ErrorMessages, SuccessMessages }