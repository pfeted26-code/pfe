import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Send } from "lucide-react";

const Messages = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const conversations = [
    {
      id: 1,
      from: "Dr. Sarah Johnson",
      role: "Instructor - CS301",
      subject: "Assignment Feedback",
      preview: "Great work on your latest assignment!",
      lastMessageTime: "10:30 AM",
      unread: true,
      avatar: "SJ"
    },
    {
      id: 2,
      from: "Admin Office",
      role: "Administration",
      subject: "Schedule Change Notice",
      preview: "Class schedule has been updated...",
      lastMessageTime: "Yesterday",
      unread: true,
      avatar: "AO"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto p-6 md:p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-muted-foreground text-lg">
            View and manage your conversations
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <div className="space-y-4">
          {conversations.map((conv, index) => (
            <Card 
              key={conv.id}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="group p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-scale-in border-none cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {conv.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold">{conv.from}</h3>
                      <p className="text-xs text-muted-foreground">{conv.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{conv.lastMessageTime}</p>
                      {conv.unread && <Badge className="mt-1 bg-accent text-white">New</Badge>}
                    </div>
                  </div>
                  <p className="font-medium text-sm mb-1">{conv.subject}</p>
                  <p className="text-sm text-muted-foreground">{conv.preview}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
