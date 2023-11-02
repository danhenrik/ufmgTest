const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');
const passwordToken = require('../../redis/password-token');
const NotAuthorizedError = require('../../errors/NotAuthorizedError');
const PermissionError = require('../../errors/PermissionError');
const InvalidParamError = require('../../errors/InvalidParamError');
const QueryError = require('../../errors/QueryError');
const TokenError = require('../../errors/TokenError');

class UserService {
  async getCurrentUser(id) {
    return await User.findByPk(id, {
      attributes: {exclude: ['password', 'updatedAt', 'createdAt']},
    });
  }

  async createUser(user) {
    try {
      const saltRounds = 10;

      user.password = await bcrypt.hash(user.password, saltRounds);

      await User.create(user);
    } catch (error) {
      if (user.image !== 'default-user-icon.jpg') {
        await fs.unlink(
          path.resolve(
            __dirname,
            '../../../react-app/public/upload',
            user.image
          )
        );
      }

      throw error;
    }
  }

  async updateUserInfo(id, body) {
    const user = await User.findByPk(id);

    if (user !== null) {
      await user.update(body);
    } else {
      throw new QueryError(`Não há um usuário com o ID ${id}!`);
    }
  }

  async updateUserPassword(id, body) {
    const user = await User.findByPk(id, {attributes: ['password']});

    if (user === null) {
      throw new QueryError(`Não há um usuário com o ID ${id}!`);
    }

    const validate = await bcrypt.compare(body.currentPassword, user.password);

    if (!validate) throw new NotAuthorizedError('Senha incorreta!');

    const passwordsAreEqual = await bcrypt.compare(
      body.newPassword,
      user.password
    );

    if (passwordsAreEqual) {
      throw new InvalidParamError('A nova senha deve ser diferente da atual');
    }

    const saltRounds = 10;

    const hashedNewPassword = await bcrypt.hash(body.newPassword, saltRounds);

    await user.update({password: hashedNewPassword});
  }

  async resetPassword(token, newPassword) {
    const email = await passwordToken.getEmail(token);

    if (email) {
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await User.update({password: hashedNewPassword}, {where: {email}});

      await passwordToken.removeToken(token);
    } else {
      throw new TokenError('O token de reset passado não existe ou expirou!');
    }
  }

  async getAllUsersByPage(options) {
    const page = options.page || 1;
    if (isNaN(page) || page <= 0) {
      throw new QueryError('A página passada é inválida!');
    }

    const orderBy = options.orderBy || 'name';
    const possibleOrdenation = ['name', 'email'];
    if (possibleOrdenation.indexOf(orderBy) === -1) {
      throw new QueryError(`'${orderBy}' não é um atributo ordenável`);
    }

    const order = options.order || 'ASC';
    const possibleOrder = ['ASC', 'DESC'];
    if (possibleOrder.indexOf(order) === -1) {
      throw new QueryError('A ordem só pode ser ascendente ou descendente');
    }

    const perPage = options.perPage || 30;
    if (isNaN(perPage) || perPage <= 0 || perPage > 60) {
      throw new QueryError(
        'Não é possível listar essa quantidade de usuários por vez!'
      );
    }

    const offset = (parseInt(page) - 1) * parseInt(perPage);
    const result = await User.findAndCountAll({
      offset: offset,
      limit: parseInt(perPage),
      order: [[orderBy, order]],
      paranoid: false,
    });

    const count = result.count;

    if (offset > count) {
      throw new QueryError(`A página ${page} está fora dos limites!`);
    }

    return {
      count,
      users: result.rows,
    };
  }

  async getUserById(id) {
    const user = await User.findByPk(id, {paranoid: false});
    return user;
  }

  async getUserByEmail(email) {
    const user = await User.findOne({where: {email: email}});
    return user;
  }

  async deactivateUser(email) {
    const user = await User.findOne({where: {email}, paranoid: false});

    if (user.deletedAt) {
      throw new PermissionError('Este usuário já está desativado!');
    }

    await user.destroy();
  }

  async activateUser(email) {
    const user = await User.findOne({where: {email}, paranoid: false});

    if (!user.deletedAt) {
      throw new PermissionError('Este usuário já está ativo!');
    }

    await user.restore();
  }
}

module.exports = new UserService();
