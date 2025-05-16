const IOTFields = {
    services: {
        headlight_service: "headlight_service",
        air_cond_service: "air_cond_service",
        drowsiness_service: "drowsiness_service",
        distance_service: "distance_service",
    },
    sensors: {
        distance: "dis",
        temp: "temp",
        humid: "humid",
        lux: "lux",
    },
    target: {
        system: "system",
        service: "service",
        threshold: "threshold",
    },
    state: {
        on: "on",
        off: "off",
        alert: "alert",
    },
    mode: {
        manual: "manual",
        auto: "auto",
    },
};

const DbDocuments = {
    servicesStatus: {
        systemStatus: "systemStatus",
        headlight_service: "headlight_service",
        air_cond_service: "air_cond_service",
        drowsiness_service: "drowsiness_service",
        dist_service: "distance_service",
        air_cond_temp: "air_cond_temp",
        headlight_brightness: "headlight_brightness",
        drowsiness_threshold: "drowsiness_threshold",
    },
    user: {
        name: "name",
        email: "email",
        phone: "phone",
        date_of_birth: "date_of_birth",
        address: "address",
    }
}

const LocalStorageFields = {
    userData: "userData",
    userAvatar: "userAvatar",
    servicesStatus: "servicesStatus",
    sensorsData: "sensorsData",
    actionHistory: "actionHistory",
    isFirstLoad: "isFirstLoad",
};

export { IOTFields, DbDocuments, LocalStorageFields }