"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Resource, ResourceCategory } from "@/lib/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { categorizeUrl } from "@/ai/flows/categorize-new-urls";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const resourceCategories: ResourceCategory[] = ['chants', 'songs', 'schedules', 'announcements', 'videos'];

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL."),
  title: z.string().min(3, "Title must be at least 3 characters."),
  category: z.enum(resourceCategories, {
    required_error: "You need to select a category.",
  }),
});

interface ContentManagerProps {
  initialResources: Resource[];
}

export function ContentManager({ initialResources }: ContentManagerProps) {
  const [resources, setResources] = useState(initialResources);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleSuggestCategory = async () => {
    const url = form.getValues("url");
    if (!url) {
      form.setError("url", { type: "manual", message: "Enter a URL to get a suggestion." });
      return;
    }

    setIsCategorizing(true);
    try {
      const result = await categorizeUrl({ url });
      const category = result.category.toLowerCase();
      if (resourceCategories.includes(category as ResourceCategory)) {
        form.setValue("category", category as ResourceCategory);
        toast({
          title: "AI Suggestion",
          description: `Suggested category: ${category}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Suggestion Error",
          description: `AI suggested an invalid category: "${category}". Please select one manually.`,
        });
      }
    } catch (error) {
      console.error("Error categorizing URL:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not get a category suggestion.",
      });
    } finally {
      setIsCategorizing(false);
    }
  };
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    // This is a mock implementation. In a real app, this would be an API call.
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      ...values,
    };
    setResources(prev => [newResource, ...prev]);
    toast({
      title: "Success",
      description: `Resource "${values.title}" added.`
    });
    form.reset({url: '', title: '', category: undefined});
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Add New Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/resource" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="relative">
                   <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-1 top-1.5 h-7 gap-1"
                      onClick={handleSuggestCategory}
                      disabled={isCategorizing}
                    >
                      <Wand2 className="h-4 w-4"/>
                      {isCategorizing ? "Thinking..." : "Suggest"}
                    </Button>
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
                </div>
                
                 <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Summer Picnic Day" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Add Resource</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Existing Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resources.map((res) => (
                <li key={res.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-semibold">{res.title}</p>
                    <p className="text-sm text-muted-foreground capitalize">{res.category}</p>
                  </div>
                  <div className="space-x-2">
                     <Button variant="ghost" size="sm" disabled>Edit</Button>
                     <Button variant="outline" size="sm" disabled>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
