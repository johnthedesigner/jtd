const { Keystone } = require("@keystonejs/keystone");
const { PasswordAuthStrategy } = require("@keystonejs/auth-password");
const { Text, Checkbox, Password } = require("@keystonejs/fields");
const { GraphQLApp } = require("@keystonejs/app-graphql");
const { AdminUIApp } = require("@keystonejs/app-admin-ui");
const { NextApp } = require("@keystonejs/app-next");
const { KnexAdapter } = require("@keystonejs/adapter-knex");

require("dotenv").config();

const PROJECT_NAME = "jtd";

const keystone = new Keystone({
  name: PROJECT_NAME,
  adapter: new KnexAdapter({
    knexOptions: {
      client: "postgres",
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
        ssl: true
      }
    }
  }),
  onConnect: async () => {
    // Add initial admin user if there are no users found
    // Admin credentials will be pulled from environment variables
    const users = await keystone.lists.User.adapter.findAll();
    if (!users.length) {
      const initialData = require("./initialData");
      await keystone.createItems(initialData);
    }
  }
});

// Access control functions
const userIsAdmin = ({ authentication: { item: user } }) =>
  Boolean(user && user.isAdmin);
const userOwnsItem = ({ authentication: { item: user } }) => {
  if (!user) {
    return false;
  }
  return { id: user.id };
};
const userIsAdminOrOwner = auth => {
  const isAdmin = access.userIsAdmin(auth);
  const isOwner = access.userOwnsItem(auth);
  return isAdmin ? isAdmin : isOwner;
};
const access = { userIsAdmin, userOwnsItem, userIsAdminOrOwner };

keystone.createList("User", {
  fields: {
    name: { type: Text },
    email: {
      type: Text,
      isUnique: true
    },
    isAdmin: { type: Checkbox },
    password: {
      type: Password
    }
  },
  // To create an initial user you can temporarily remove access controls
  access: {
    read: access.userIsAdminOrOwner,
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true
  }
});

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: "User"
});

// Create initial admin user
// keystone.onConnect(() => {
//   keystone.createItems({
//     User: [
//       {
//         name: process.env.ADMIN_NAME,
//         email: process.env.ADMIN_EMAIL,
//         password: process.env.ADMIN_INIT_PASSWORD,
//         isAdmin: true
//       }
//     ]
//   });
// });

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    // To create an initial user you can temporarily remove the authStrategy below
    new AdminUIApp({ enableDefaultRoute: false, authStrategy }),
    new NextApp({ dir: "app" })
  ]
};
