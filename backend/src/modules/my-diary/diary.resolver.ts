import { DiaryService } from './diary.service';

export const diaryResolvers = {
    Query: {
        myTodos: async (_: any, __: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            await DiaryService.ensureDefaults(context.user.userId);
            return DiaryService.getTodos(context.user.userId);
        },
        myBookmarks: async (_: any, __: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            await DiaryService.ensureDefaults(context.user.userId);
            return DiaryService.getBookmarks(context.user.userId);
        },
    },
    Mutation: {
        createDiaryTodo: async (_: any, { input }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.createTodo(context.user.userId, input.task, input.description, input.isCompleted);
        },
        updateDiaryTodo: async (_: any, { id, input }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.updateTodo(id, context.user.userId, input);
        },
        deleteDiaryTodo: async (_: any, { id }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.deleteTodo(id, context.user.userId);
        },
        reorderDiaryTodos: async (_: any, { ids }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.reorderTodos(context.user.userId, ids);
        },
        createDiaryBookmark: async (_: any, { input }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.createBookmark(context.user.userId, input.title, input.url);
        },
        updateDiaryBookmark: async (_: any, { id, input }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.updateBookmark(id, context.user.userId, input);
        },
        deleteDiaryBookmark: async (_: any, { id }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.deleteBookmark(id, context.user.userId);
        },
        reorderDiaryBookmarks: async (_: any, { ids }: any, context: any) => {
            if (!context.user) throw new Error('Not authenticated');
            return DiaryService.reorderBookmarks(context.user.userId, ids);
        },
    },
};
