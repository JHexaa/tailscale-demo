import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create permissions
  const permissions = [
    // Auth service - Users
    { service: 'auth', module: 'users', action: 'create', description: 'Create users' },
    { service: 'auth', module: 'users', action: 'read', description: 'View users' },
    { service: 'auth', module: 'users', action: 'update', description: 'Update users' },
    { service: 'auth', module: 'users', action: 'delete', description: 'Delete users' },
    // Auth service - Roles
    { service: 'auth', module: 'roles', action: 'create', description: 'Create roles' },
    { service: 'auth', module: 'roles', action: 'read', description: 'View roles' },
    { service: 'auth', module: 'roles', action: 'update', description: 'Update roles' },
    { service: 'auth', module: 'roles', action: 'delete', description: 'Delete roles' },
    // Future services placeholders
    { service: 'catalog', module: 'products', action: 'create', description: 'Create products' },
    { service: 'catalog', module: 'products', action: 'read', description: 'View products' },
    { service: 'catalog', module: 'products', action: 'update', description: 'Update products' },
    { service: 'catalog', module: 'products', action: 'delete', description: 'Delete products' },
  ];

  console.log('Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        service_module_action: {
          service: permission.service,
          module: permission.module,
          action: permission.action,
        },
      },
      update: {},
      create: permission,
    });
  }
  console.log(`Created ${permissions.length} permissions`);

  // Create default organization
  console.log('Creating default organization...');
  const organization = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
    },
  });
  console.log(`Created organization: ${organization.name}`);

  // Get all permissions for admin role
  const allPermissions = await prisma.permission.findMany();

  // Create admin role
  console.log('Creating admin role...');
  const adminRole = await prisma.role.upsert({
    where: {
      name_organizationId: {
        name: 'Admin',
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system access',
      organizationId: organization.id,
      isSystem: true,
    },
  });

  // Assign all permissions to admin role
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`Admin role created with ${allPermissions.length} permissions`);

  // Create user role (read-only)
  console.log('Creating user role...');
  const readPermissions = await prisma.permission.findMany({
    where: { action: 'read' },
  });

  const userRole = await prisma.role.upsert({
    where: {
      name_organizationId: {
        name: 'User',
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      name: 'User',
      description: 'Basic read access',
      organizationId: organization.id,
      isSystem: true,
    },
  });

  for (const permission of readPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`User role created with ${readPermissions.length} permissions`);

  // Create admin user
  console.log('Creating admin user...');
  const passwordHash = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: {
      email_organizationId: {
        email: 'admin@example.com',
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      organizationId: organization.id,
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log(`Admin user created: ${adminUser.email}`);
  console.log('');
  console.log('='.repeat(50));
  console.log('Seed completed successfully!');
  console.log('='.repeat(50));
  console.log('');
  console.log('Default admin credentials:');
  console.log('  Organization: default');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
