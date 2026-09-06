import { SetMetadata } from "@nestjs/common"

const ROLES_KEY='roles'

export const Roles = (...roles:string[])=>{
    return SetMetadata(ROLES_KEY, roles);
}