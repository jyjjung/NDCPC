
"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { addResource } from "@/lib/data";

const formSchema = z.object({
  url: z.string().url("Please enter a valid YouTube URL.").refine(
    (url) => url.includes("youtube.com/watch") || url.includes("youtu.be"),
    "Please provide a valid YouTube URL."
  ),
  category: z.enum(['songs', 'chants'], {
    required_error: "You need to select a resource type.",
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
      const oembedResponse = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(values.url)}`);
      if (!oembedResponse.ok) {
        const errorText = await oembedResponse.text();
        console.error("Oembed fetch failed:", errorText);
        throw new Error('Could not fetch video details from URL.');
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

      addResource(newResource);

      toast({
        title: "Success!",
        description: `"${newResource.title}" has been added to the "${newResource.category}" page.`
      });
      
      form.reset({url: '', category: undefined});
      
      // Force a hard navigation to the category page to ensure fresh data
      window.location.href = `/${newResource.category}`;

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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Add a Resource</CardTitle>
          <CardDescription>Submit a YouTube URL for a new song or chant.</CardDescription>
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
        </CardContent>
      </Card>
  );
}
