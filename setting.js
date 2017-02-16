var app_setting = {
    secret: 'Affilinet',
    database: 'affilinet',
    username: 'LLHF',
    password: 'LLHF!allhaha',
    partner_username: "jun.shao",
    partner_password: "shaojun",
    partner_username_1: "liaocheng",
    partner_password_1: "Liaocheng123",
    affilinet_setting: {
        publisherId: '760068',
        productWebservicePassword: 'YXysbEHNzfKCyFhAyESb',
        publisherWebservicePassword: 'M10iuaVZB1VyJk8O42hV'
    },
    amazon_setting: {
        AccessKeyId: 'AKIAIVOAWHV7T4HBZLOA',
        SecretAccessKey: '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',
        AssociateTag: 'allhaha-21'
    },
    email_setting: {
        service: 'hotmail',
        from: 'info@allhaha.com',
        toAdmin: 'info@allhaha.com',
        auth: {
            user: 'info@allhaha.com',
            pass: 'LLHF!allhaha.com'
        },
    },
    smtp_setting: {
        host: 'ex.mail.ovh.net',
        port: 587,
        secure: 'true',
        auth: {
            user: 'info@allhaha.com',
            pass: 'LLHF!allhaha.com'
        },
    },
    stormpath_setting: {
        API_KEY_ID: '2R0MZVWQRYZ8L1WV9FAR5XWEN',
        API_KEY_SECRET: 'QKrjkPly30p4amNCWnPWsbjsj1ulASCiF1P/WKC9ucE',
        APP_HREF: 'https://api.stormpath.com/v1/applications/4zQYkYfG2y0xcD6bultOxW',
    },
    duoshuo_setting: {
        profileURL: "http://api.duoshuo.com/users/profile.json",
        authURL: "http://api.duoshuo.com/oauth2/access_token",
        importURL: "http://api.duoshuo.com/users/import.json",
        short_name: 'allhaha',
        secret: '21d51207d519e830deab40d57645d343'
    },
    facebook_setting: {
        clientID: "1134828276538020",
        clientSecret: "0bf5b4d8c0354acc2d3cb822a3e5ef55",
        callbackURL: 'http://localhost:8818/login/facebook/return',
    }
};

module.exports = app_setting;
