import { UseMutateFunction } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { DefaultValues, useForm } from "react-hook-form";
import z from "zod";

export const useZodForm = <T extends z.ZodType<any, any, any>, TMutation = any>(
  schema: T,
  mutation: UseMutateFunction<TMutation, any, any, any>,
  defaultValues?: DefaultValues<z.infer<T>> | undefined
) => {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const onFormSubmit = handleSubmit(async (values) => mutation(values as TMutation));

  return { register, watch, reset, onFormSubmit, errors };
};