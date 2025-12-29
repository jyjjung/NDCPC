"use client";

import { useState } from "react";
import { Resource } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContentManagerProps {
  initialResources: Resource[];
}

export function ContentManager({ initialResources }: ContentManagerProps) {
  const [resources, setResources] = useState(initialResources);
  
  return (
      <div>
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
  );
}
