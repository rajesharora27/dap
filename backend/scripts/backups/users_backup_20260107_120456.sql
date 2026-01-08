--
-- PostgreSQL database dump
--

\restrict lTt1OObsp2WwiPxWYVRh8HplX27UMQUwg5sUUBaNuxLsIVW7vNbym62O3WHId5l

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: rajarora
--

INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmjj38w5h0004e9ewq6tsixb3', 'cssuser@cxsaaslab.com', 'cssuser', NULL, '$2a$10$a5PhLtxS/kSlQFBzQu9ok.MuKfaqEkMjPUMcjv.CY2Kbvbyu5DAIG', '2025-12-23 21:19:45.606', 'CSS User', true, false, false, '2025-12-23 21:19:55.57', 'USER');
INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmjj39h1d000de9ewpohuhssk', 'smeuser@cxsaaslab.com', 'smeuser', NULL, '$2a$10$UgdqAxUK53wPeIHWHqPvZORLr/KR6gCCR.pevnuPj2CKxVv.jIO/m', '2025-12-23 21:20:12.673', 'SME User', true, false, false, '2025-12-23 21:20:21.75', 'USER');
INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmjj3a30p000me9ewly7u34lx', 'dapuser@cxsaaslab.com', 'dapuser', NULL, '$2a$10$sGEu8Skl3HQZ7fiaD6An3O9SCU0N93wngvhkip5AbRSTW2kTfBlPW', '2025-12-23 21:20:41.162', 'DAP User', true, false, false, '2025-12-23 21:20:52.013', 'USER');
INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmjj1960y0000lwc59io7kwom', 'rajarora@cisco.com', 'admin', 'Admin', '$2a$10$X5me6DG5RCx953aUgaVmBukmlhrzfbiZvQbtCqZVkFNXEbJBa4dCS', '2025-12-23 20:23:59.17', 'Admin', true, true, false, '2026-01-07 17:04:17.208', 'ADMIN');
INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmk49pxii000hkw5ylr7a87hp', 'Raj Arora', 'rajarora', NULL, '$2a$10$VKusyUdDBqbSJEdNucpBUO3yVLchQIRQImgfYR/RUoi8/Ig4ByOgW', '2026-01-07 17:04:07.914', 'rajrora@cxsaaslab.com', true, false, false, '2026-01-07 17:04:33.113', 'USER');


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: rajarora
--

INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmjj85eej000310bq4le01j1j', NULL, 'CREATE_CUSTOMER', 'Customer', 'cmjj85eef000210bq3tyhw9tl', '{"input": {"name": "TEST RESTORE CUSTOMER", "description": "This customer should disappear after restore"}}', '2025-12-23 23:37:00.715', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmjj85swd000710bqavuq902h', NULL, 'CREATE_CUSTOMER', 'Customer', 'cmjj85swc000610bqwxxjc023', '{"input": {"name": "TEST RESTORE CUSTOMER", "description": "This customer should disappear after restore"}}', '2025-12-23 23:37:19.502', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmjswivs900034r800caaklam', 'cmjj1960y0000lwc59io7kwom', 'login', NULL, NULL, '{"message": "User logged in successfully"}', '2025-12-30 18:09:16.138', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmjswjyfr00074r8079wbex3v', 'cmjj1960y0000lwc59io7kwom', 'login', NULL, NULL, '{"message": "User logged in successfully"}', '2025-12-30 18:10:06.232', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmjsymwhp0007auav8d5i7vuu', 'cmjj1960y0000lwc59io7kwom', 'login', NULL, NULL, '{"message": "User logged in successfully"}', '2025-12-30 19:08:22.909', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmjsynlym0009auav87x6g25v', 'cmjj1960y0000lwc59io7kwom', 'update_user', NULL, NULL, '{"message": "Updated user admin"}', '2025-12-30 19:08:55.919', NULL, 'cmjj1960y0000lwc59io7kwom', 'user');
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmjsynzgo000dauav2xmm4sbp', 'cmjj1960y0000lwc59io7kwom', 'login', NULL, NULL, '{"message": "User logged in successfully"}', '2025-12-30 19:09:13.416', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49ox4d000ckw5yuad1kogk', 'cmjj1960y0000lwc59io7kwom', 'login', NULL, NULL, '{"message": "User logged in successfully"}', '2026-01-07 17:03:20.749', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49p59u000ekw5yqx8ng1bi', 'cmjj1960y0000lwc59io7kwom', 'delete_user', NULL, NULL, '{"message": "Deleted user test_verify_user"}', '2026-01-07 17:03:31.314', NULL, 'cmjj9lso90000pja2arg5sp77', 'user');
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49pa3d000gkw5yyddy7br5', 'cmjj1960y0000lwc59io7kwom', 'delete_user', NULL, NULL, '{"message": "Deleted user user"}', '2026-01-07 17:03:37.562', NULL, 'cmjswfqm400008g1wf1il529k', 'user');
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49pxio000jkw5ypjik7m96', 'cmjj1960y0000lwc59io7kwom', 'create_user', NULL, NULL, '{"message": "Created user rajarora"}', '2026-01-07 17:04:07.92', NULL, 'cmk49pxii000hkw5ylr7a87hp', 'user');
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49q4or000lkw5y7g4fm318', 'cmjj1960y0000lwc59io7kwom', 'update_user', NULL, NULL, '{"message": "Updated user admin"}', '2026-01-07 17:04:17.211', NULL, 'cmjj1960y0000lwc59io7kwom', 'user');
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49qgyj000nkw5yq51n0flv', 'cmjj1960y0000lwc59io7kwom', 'update_user', NULL, NULL, '{"message": "Updated user rajarora"}', '2026-01-07 17:04:33.115', NULL, 'cmk49pxii000hkw5ylr7a87hp', 'user');
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49qgyy000rkw5y9gwycdjs', 'cmjj1960y0000lwc59io7kwom', 'assign_role', NULL, NULL, '{"roleId": "cmi3mf7yw000bsuyl0uf8zes1", "roleName": "CSS", "targetUserId": "cmk49pxii000hkw5ylr7a87hp"}', '2026-01-07 17:04:33.13', NULL, NULL, NULL);
INSERT INTO public."AuditLog" (id, "userId", action, entity, "entityId", details, "createdAt", "ipAddress", "resourceId", "resourceType") VALUES ('cmk49qgz7000vkw5yjgnmr84p', 'cmjj1960y0000lwc59io7kwom', 'assign_role', NULL, NULL, '{"roleId": "cmi3meajh0007suyli14p5jzl", "roleName": "SME", "targetUserId": "cmk49pxii000hkw5ylr7a87hp"}', '2026-01-07 17:04:33.139', NULL, NULL, NULL);


--
-- Data for Name: ChangeSet; Type: TABLE DATA; Schema: public; Owner: rajarora
--



--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: rajarora
--

INSERT INTO public."Session" (id, "userId", "createdAt", "updatedAt", "expiresAt") VALUES ('cmk49ox47000akw5ytfpbpj9r', 'cmjj1960y0000lwc59io7kwom', '2026-01-07 17:03:20.744', '2026-01-07 17:04:33.157', '2026-01-07 17:34:33.156');


--
-- Data for Name: LockedEntity; Type: TABLE DATA; Schema: public; Owner: rajarora
--



--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: rajarora
--



--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: rajarora
--

INSERT INTO public."Role" (id, name, description, "createdAt", "updatedAt") VALUES ('cmi3mf7yw000bsuyl0uf8zes1', 'CSS', 'Customer Success Specialist', '2025-11-27 22:00:03.16', '2025-12-09 14:24:07.525');
INSERT INTO public."Role" (id, name, description, "createdAt", "updatedAt") VALUES ('cmi3meajh0007suyli14p5jzl', 'SME', 'SME for all products', '2025-11-27 22:00:03.132', '2025-12-09 14:24:32.588');
INSERT INTO public."Role" (id, name, description, "createdAt", "updatedAt") VALUES ('cmixyxvei0002svwdnodp416a', 'VIEWER', 'Read Only Users', '2025-12-09 02:36:03.258', '2025-12-09 14:25:28.43');


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: rajarora
--

INSERT INTO public."RolePermission" (id, "roleId", "resourceType", "resourceId", "permissionLevel", "createdAt", "updatedAt") VALUES ('cmiyo8gha0000sv5z971fat6a', 'cmi3mf7yw000bsuyl0uf8zes1', 'CUSTOMER', NULL, 'ADMIN', '2025-12-09 14:24:07.534', '2025-12-09 14:24:07.534');
INSERT INTO public."RolePermission" (id, "roleId", "resourceType", "resourceId", "permissionLevel", "createdAt", "updatedAt") VALUES ('cmiyo8ztd0002sv6cnz7h1dft', 'cmi3meajh0007suyli14p5jzl', 'PRODUCT', NULL, 'ADMIN', '2025-12-09 14:24:32.594', '2025-12-09 14:24:32.594');
INSERT INTO public."RolePermission" (id, "roleId", "resourceType", "resourceId", "permissionLevel", "createdAt", "updatedAt") VALUES ('cmiyo8ztd0003sv6c21km84bh', 'cmi3meajh0007suyli14p5jzl', 'SOLUTION', NULL, 'ADMIN', '2025-12-09 14:24:32.594', '2025-12-09 14:24:32.594');
INSERT INTO public."RolePermission" (id, "roleId", "resourceType", "resourceId", "permissionLevel", "createdAt", "updatedAt") VALUES ('cmiyoa6wj0006sv6c0xnmvxcn', 'cmixyxvei0002svwdnodp416a', 'PRODUCT', NULL, 'READ', '2025-12-09 14:25:28.435', '2025-12-09 14:25:28.435');
INSERT INTO public."RolePermission" (id, "roleId", "resourceType", "resourceId", "permissionLevel", "createdAt", "updatedAt") VALUES ('cmiyoa6wj0007sv6c71gme1d5', 'cmixyxvei0002svwdnodp416a', 'SOLUTION', NULL, 'READ', '2025-12-09 14:25:28.435', '2025-12-09 14:25:28.435');
INSERT INTO public."RolePermission" (id, "roleId", "resourceType", "resourceId", "permissionLevel", "createdAt", "updatedAt") VALUES ('cmiyoa6wj0008sv6cd5vc6p29', 'cmixyxvei0002svwdnodp416a', 'CUSTOMER', NULL, 'READ', '2025-12-09 14:25:28.435', '2025-12-09 14:25:28.435');


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: rajarora
--

INSERT INTO public."UserRole" (id, "userId", "roleId", "roleName", "createdAt") VALUES ('cmjj393un000ae9ewlbv7wezd', 'cmjj38w5h0004e9ewq6tsixb3', 'cmi3mf7yw000bsuyl0uf8zes1', NULL, '2025-12-23 21:19:55.583');
INSERT INTO public."UserRole" (id, "userId", "roleId", "roleName", "createdAt") VALUES ('cmjj39o1r000je9ewx40zepyz', 'cmjj39h1d000de9ewpohuhssk', 'cmi3meajh0007suyli14p5jzl', NULL, '2025-12-23 21:20:21.76');
INSERT INTO public."UserRole" (id, "userId", "roleId", "roleName", "createdAt") VALUES ('cmjj3abed000se9ewacvfexty', 'cmjj3a30p000me9ewly7u34lx', 'cmixyxvei0002svwdnodp416a', NULL, '2025-12-23 21:20:52.021');
INSERT INTO public."UserRole" (id, "userId", "roleId", "roleName", "createdAt") VALUES ('cmk49qgyx000pkw5ybqxwtdkr', 'cmk49pxii000hkw5ylr7a87hp', 'cmi3mf7yw000bsuyl0uf8zes1', NULL, '2026-01-07 17:04:33.129');
INSERT INTO public."UserRole" (id, "userId", "roleId", "roleName", "createdAt") VALUES ('cmk49qgz6000tkw5y5i9davj6', 'cmk49pxii000hkw5ylr7a87hp', 'cmi3meajh0007suyli14p5jzl', NULL, '2026-01-07 17:04:33.139');


--
-- PostgreSQL database dump complete
--

\unrestrict lTt1OObsp2WwiPxWYVRh8HplX27UMQUwg5sUUBaNuxLsIVW7vNbym62O3WHId5l

