
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResourceCategory } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const resourceCategories: Exclude<ResourceCategory, 'schedules' | 'announcements'>[] = ['chants', 'songs'];

const formSchema = z.object({
  url: z.string().url("Please enter a valid YouTube URL.").refine(
    (url) => url.includes("youtube.com/watch") || url.includes("youtu.be"),
    "Please provide a valid YouTube URL."
  ),
  category: z.enum(resourceCategories, {
    required_error: "You need to select a category.",
  }),
});

export function AddResourceForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    }
  });

  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Use noembed.com to fetch YouTube video title
      const oembedResponse = await fetch(`https://noembed.com/embed?url=${values.url}`);
      if (!oembedResponse.ok) {
        throw new Error('Could not fetch video details.');
      }
      const data = await oembedResponse.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const newResource = {
        id: `res-${Date.now()}`,
        title: data.title || 'Untitled Video',
        url: values.url,
        category: values.category,
      };

      // In a real app, this would be an API call to save to a database.
      // For now, we'll just log it and show a success message.
      console.log("New resource added:", newResource);

      toast({
        title: "Success!",
        description: `"${newResource.title}" has been added to the "${newResource.category}" page.`
      });
      
      form.reset({url: '', category: undefined});
      router.push(`/${newResource.category}`);

    } catch (error: any) {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Add a Song or Chant</CardTitle>
          <CardDescription>Submit a YouTube URL for a new resource. It will be added to the library automatically.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resourceCategories.map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                        ))}
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
        </CardContent>
      </Card>
  );
}
