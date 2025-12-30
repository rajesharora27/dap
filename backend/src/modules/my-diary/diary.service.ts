import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DiaryService {
    // Todos
    static async getTodos(userId: string) {
        return prisma.diaryTodo.findMany({
            where: { userId },
            orderBy: { sequenceNumber: 'asc' },
        });
    }

    static async createTodo(userId: string, task: string, description?: string, isCompleted: boolean = false) {
        const lastTodo = await prisma.diaryTodo.findFirst({
            where: { userId },
            orderBy: { sequenceNumber: 'desc' },
        });
        const sequenceNumber = lastTodo ? lastTodo.sequenceNumber + 1 : 0;

        return prisma.diaryTodo.create({
            data: {
                userId,
                task,
                description,
                isCompleted,
                sequenceNumber,
            },
        });
    }

    static async updateTodo(id: string, userId: string, data: { task?: string; description?: string | null; isCompleted?: boolean }) {
        return prisma.diaryTodo.update({
            where: { id, userId },
            data,
        });
    }

    static async deleteTodo(id: string, userId: string) {
        await prisma.diaryTodo.delete({
            where: { id, userId },
        });
        return true;
    }

    static async reorderTodos(userId: string, ids: string[]) {
        for (let i = 0; i < ids.length; i++) {
            await prisma.diaryTodo.update({
                where: { id: ids[i], userId },
                data: { sequenceNumber: i },
            });
        }
        return this.getTodos(userId);
    }

    // Bookmarks
    static async getBookmarks(userId: string) {
        return prisma.diaryBookmark.findMany({
            where: { userId },
            orderBy: { sequenceNumber: 'asc' },
        });
    }

    static async createBookmark(userId: string, title: string, url: string) {
        const lastBookmark = await prisma.diaryBookmark.findFirst({
            where: { userId },
            orderBy: { sequenceNumber: 'desc' },
        });
        const sequenceNumber = lastBookmark ? lastBookmark.sequenceNumber + 1 : 0;

        return prisma.diaryBookmark.create({
            data: {
                userId,
                title,
                url,
                sequenceNumber,
            },
        });
    }

    static async updateBookmark(id: string, userId: string, data: { title?: string; url?: string }) {
        return prisma.diaryBookmark.update({
            where: { id, userId },
            data,
        });
    }

    static async deleteBookmark(id: string, userId: string) {
        await prisma.diaryBookmark.delete({
            where: { id, userId },
        });
        return true;
    }

    static async reorderBookmarks(userId: string, ids: string[]) {
        for (let i = 0; i < ids.length; i++) {
            await prisma.diaryBookmark.update({
                where: { id: ids[i], userId },
                data: { sequenceNumber: i },
            });
        }
        return this.getBookmarks(userId);
    }

    static async ensureDefaults(userId: string) {
        // Check if user has any todos
        const todoCount = await prisma.diaryTodo.count({ where: { userId } });
        if (todoCount === 0) {
            await prisma.diaryTodo.create({
                data: {
                    userId,
                    task: 'Update your products and solutions',
                    description: 'Please ensure that your products and solutions are up to date.',
                    isCompleted: false,
                    sequenceNumber: 0,
                },
            });
        }

        // Check if user has any bookmarks
        const bookmarkCount = await prisma.diaryBookmark.count({ where: { userId } });
        if (bookmarkCount === 0) {
            await prisma.diaryBookmark.create({
                data: {
                    userId,
                    title: 'CEC',
                    url: 'https://wwwin.cisco.com/',
                    sequenceNumber: 0,
                },
            });
        }
    }
}
