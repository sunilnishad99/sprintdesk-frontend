import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../api/boardService';
import type { NewTaskInput, Task } from '../types/board';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: boardService.getUsers, staleTime: Infinity });
}

export function useSprints() {
  return useQuery({ queryKey: ['sprints'], queryFn: boardService.getSprints, staleTime: Infinity });
}

export function useTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: boardService.getTasks });
}

export function useComments(taskId: number | null) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => boardService.getComments(taskId as number),
    enabled: taskId !== null,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTaskInput) => boardService.createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<Task> }) =>
      boardService.updateTask(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => boardService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, authorId, message }: { taskId: number; authorId: number; message: string }) =>
      boardService.addComment(taskId, authorId, message),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.taskId] });
    },
  });
}
