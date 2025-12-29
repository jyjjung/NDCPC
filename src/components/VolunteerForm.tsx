
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

export function VolunteerForm({ onSuccess }: { onSuccess: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      await addDoc(collection(firestore, 'volunteers'), values);
      toast({ title: "Success", description: `Volunteer "${values.name}" added.` });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error("Error adding volunteer: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add volunteer.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Volunteer Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Adding..." : "Add"}
        </Button>
      </form>
    </Form>
  );
}
