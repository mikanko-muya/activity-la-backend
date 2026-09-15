import { userRepository } from "../user/user.repository.js"

export const authRepository = {
    create: (data) => { return userRepository.create(data) },
    findByPhone: (phone) => { return userRepository.findByPhone(phone) },
    findById: (id) => { return userRepository.findById(id) },
    updateById: (id, data) => { return userRepository.update({ where: { id }, data }) }
}

