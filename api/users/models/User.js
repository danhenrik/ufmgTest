const sequelize = require('../../database');
const {DataTypes} = require('sequelize');
const {nanoid} = require('nanoid');

const User = sequelize.define('Users', {
  id: {
    type: DataTypes.STRING(21),
    defaultValue: function() {
      return nanoid();
    },
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  personalEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM,
    values: ['admin', 'user'],
    allowNull: false,
  },
},
{
  paranoid: true,
});

/*
Comando para criar/alterar as
colunas da tabela caso necessário
 */
User.sync({alter: false, force: false})
  .then(() => {
    console.log('User table was (re)created');
  })
  .catch((err) => console.log(err));

module.exports = User;
