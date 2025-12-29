
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
import { useFirestore } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

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
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    }
  });

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
      
      form.reset({url: '', category: undefined});
      
      router.push(`/${values.category}`);
      router.refresh();

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
