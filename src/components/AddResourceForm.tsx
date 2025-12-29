
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { collection, serverTimestamp, addDoc } from "firebase/firestore";

const formSchema = z.object({
  url: z.string().url("Please enter a valid YouTube URL.").refine(
    (url) => url.includes("youtube.com/watch") || url.includes("youtu.be"),
    "Please provide a valid YouTube URL."
  ),
  category: z.enum(['songs', 'chants'], {
    required_error: "You need to select a resource type.",
  }),
});

interface AddResourceFormProps {
  initialCategory?: 'songs' | 'chants';
  onSuccess?: () => void;
}

export function AddResourceForm({ initialCategory, onSuccess }: AddResourceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      category: initialCategory,
    }
  });

  useEffect(() => {
    form.reset({ url: '', category: initialCategory });
  }, [initialCategory, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore is not available.",
      });
      return;
    }
    setIsSubmitting(true);
    
    try {
      const oembedResponse = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(values.url)}`);
      if (!oembedResponse.ok) {
        throw new Error('Could not fetch video details from URL.');
      }
      const data = await oembedResponse.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const resourcesCollectionRef = collection(firestore, 'resources');
      
      const newResource = {
        title: data.title || 'Untitled Video',
        url: values.url,
        category: values.category,
        createdAt: serverTimestamp(),
      };

      await addDoc(resourcesCollectionRef, newResource);
      
      toast({
        title: "Success!",
        description: `"${newResource.title}" has been added to the "${values.category}" page.`
      });
      
      form.reset({url: '', category: initialCategory});
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not add the resource. Please check the URL and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="songs">Song</SelectItem>
                    <SelectItem value="chants">Chant</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Resource"}
          </Button>
        </form>
      </Form>
  );
}
