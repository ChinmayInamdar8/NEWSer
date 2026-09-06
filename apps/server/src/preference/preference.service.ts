import { ConflictException, Injectable } from '@nestjs/common';
import { prisma } from '@workspace/db';
import { CreatePreference } from '@workspace/types';

@Injectable()
export class PreferenceService {
  async getAllPreference() {
    const preference = await prisma.preference.findMany({
      select: {
        name: true,
        slug: true,
        is_active: true,
        id:true,
      },
    });
    return preference;
  }

  async createPrefeerence(body: CreatePreference) {
    // step 1 check if already the preference exists with the same name or same slug
    const preference = await prisma.preference.findFirst({
      where: {
        OR: [{ name: body.name }, { slug: body.slug }],
      },
    });

    if (preference) {
      throw new ConflictException(
        'Preference with this name or slug already exists',
      );
    }
    // step 2 create the preference and return 201

    const createdPreference = await prisma.preference.create({
      data: body,
    });

    return createdPreference;
  }

  async deletePreference (id:string){
    // todo : first delete all the mappings of users and preference for which we are going to delete it.
    const deletedPreference = await prisma.preference.delete({
        where:{
            id
        }
    })
    return deletedPreference;
  }
}
