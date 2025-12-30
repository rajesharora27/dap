--
-- PostgreSQL database dump
--

\restrict V0gBWjClhx9DffX6rVBWs1DhfLZXMhA7aoTrqXdpS6EQ88ozcGlmIUOHmSdELJw

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
INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmjj9lso90000pja2arg5sp77', 'test_verify_user@example.com', 'test_verify_user', 'Test Verify User', 'hashedpassword', '2025-12-24 00:17:45.321', '', true, false, true, '2025-12-24 00:17:45.321', 'USER');
INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmjswfqm400008g1wf1il529k', 'user@example.com', 'user', NULL, '$2a$10$fJSsT/MtnrJIn8Yo7KzQeOo7zbTL9n/570iGmcHCDoOopVVpNk80q', '2025-12-30 18:06:49.468', 'Standard User', true, false, false, '2025-12-30 18:06:49.468', 'USER');
INSERT INTO public."User" (id, email, username, name, password, "createdAt", "fullName", "isActive", "isAdmin", "mustChangePassword", "updatedAt", role) VALUES ('cmjj1960y0000lwc59io7kwom', 'rajarora@cisco.com', 'admin', 'Admin', '$2a$10$X5me6DG5RCx953aUgaVmBukmlhrzfbiZvQbtCqZVkFNXEbJBa4dCS', '2025-12-23 20:23:59.17', 'Raj Arora', true, true, false, '2025-12-30 19:08:55.917', 'ADMIN');


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


--
-- Data for Name: ChangeSet; Type: TABLE DATA; Schema: public; Owner: rajarora
--



--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: rajarora
--

INSERT INTO public."Session" (id, "userId", "createdAt", "updatedAt", "expiresAt") VALUES ('cmjswivs600014r80zbflncbg', 'cmjj1960y0000lwc59io7kwom', '2025-12-30 18:09:16.134', '2025-12-30 18:09:16.134', '2026-01-06 18:09:16.133');
INSERT INTO public."Session" (id, "userId", "createdAt", "updatedAt", "expiresAt") VALUES ('cmjswjyfq00054r804gzxluc8', 'cmjj1960y0000lwc59io7kwom', '2025-12-30 18:10:06.23', '2025-12-30 18:10:06.23', '2026-01-06 18:10:06.23');
INSERT INTO public."Session" (id, "userId", "createdAt", "updatedAt", "expiresAt") VALUES ('cmjsymwhn0005auavg93gofi8', 'cmjj1960y0000lwc59io7kwom', '2025-12-30 19:08:22.907', '2025-12-30 19:08:22.907', '2026-01-06 19:08:22.907');
INSERT INTO public."Session" (id, "userId", "createdAt", "updatedAt", "expiresAt") VALUES ('cmjsynzgm000bauavpyjk4lv4', 'cmjj1960y0000lwc59io7kwom', '2025-12-30 19:09:13.415', '2025-12-30 19:09:13.415', '2026-01-06 19:09:13.414');


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


--
-- PostgreSQL database dump complete
--

\unrestrict V0gBWjClhx9DffX6rVBWs1DhfLZXMhA7aoTrqXdpS6EQ88ozcGlmIUOHmSdELJw

