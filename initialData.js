module.exports = {
  User: [
    {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_INIT_PASSWORD,
      isAdmin: true
    }
  ]
};
