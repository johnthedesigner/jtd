const {
  File,
  Text,
  Slug,
  Relationship,
  Select,
  Password,
  Checkbox,
  DateTime,
  OEmbed
} = require("@keystonejs/fields");
const { Wysiwyg } = require("@keystonejs/fields-wysiwyg-tinymce");
const { LocalFileAdapter } = require("@keystonejs/file-adapters");
const { staticRoute, staticPath, distDir } = require("./config");
const dev = process.env.NODE_ENV !== "production";

const fileAdapter = new LocalFileAdapter({
  src: `${dev ? "" : `${distDir}/`}${staticPath}/uploads`,
  path: `${staticRoute}/uploads`
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

exports.User = {
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
};

exports.Post = {
  fields: {
    title: { type: Text },
    slug: { type: Slug, from: "title" },
    author: {
      type: Relationship,
      ref: "User"
    },
    categories: {
      type: Relationship,
      ref: "PostCategory",
      many: true
    },
    status: {
      type: Select,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" }
      ]
    },
    body: { type: Wysiwyg },
    posted: { type: DateTime, format: "DD/MM/YYYY" },
    image: { type: File, adapter: fileAdapter }
  },
  adminConfig: {
    defaultPageSize: 20,
    defaultColumns: "title, status",
    defaultSort: "title"
  },
  labelResolver: item => item.title
};

exports.PostCategory = {
  fields: {
    name: { type: Text },
    slug: { type: Slug, from: "name" }
  }
};
