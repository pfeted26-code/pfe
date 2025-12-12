import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

export default function TeacherSchedule() {
  const [selectedWeek, setSelectedWeek] = useState('current');

  const schedule = [
    {
      id: 1,
      day: 'Monday',
      date: '2024-01-15',
      classes: [
        { time: '09:00 AM - 10:30 AM', course: 'Mathematics 101', room: 'Room 301', students: 45 },
        { time: '02:00 PM - 03:30 PM', course: 'Calculus I', room: 'Room 402', students: 38 }
      ]
    },
    {
      id: 2,
      day: 'Tuesday',
      date: '2024-01-16',
      classes: [
        { time: '11:00 AM - 12:30 PM', course: 'Algebra II', room: 'Room 205', students: 42 }
      ]
    },
    {
      id: 3,
      day: 'Wednesday',
      date: '2024-01-17',
      classes: [
        { time: '09:00 AM - 10:30 AM', course: 'Mathematics 101', room: 'Room 301', students: 45 },
        { time: '04:00 PM - 05:30 PM', course: 'Statistics', room: 'Room 108', students: 35 }
      ]
    },
    {
      id: 4,
      day: 'Thursday',
      date: '2024-01-18',
      classes: [
        { time: '11:00 AM - 12:30 PM', course: 'Algebra II', room: 'Room 205', students: 42 }
      ]
    },
    {
      id: 5,
      day: 'Friday',
      date: '2024-01-19',
      classes: [
        { time: '10:00 AM - 11:30 AM', course: 'Geometry', room: 'Room 315', students: 40 },
        { time: '02:00 PM - 03:30 PM', course: 'Calculus I', room: 'Room 402', students: 38 }
      ]
    }
  ];

  const todayClasses = schedule.find(day => day.day === 'Monday')?.classes || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Teaching Schedule
            </h1>
            <p className="text-muted-foreground mt-1">View your weekly teaching schedule</p>
          </div>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous Week</SelectItem>
              <SelectItem value="current">Current Week</SelectItem>
              <SelectItem value="next">Next Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutralLight transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{cls.time.split(' ')[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{cls.course}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cls.room}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cls.students} students
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button size="sm">Take Attendance</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Your complete teaching schedule for the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.map((day) => (
                <div key={day.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{day.day}</h3>
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                  </div>
                  {day.classes.length > 0 ? (
                    <div className="space-y-2">
                      {day.classes.map((cls, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-neutralLight rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{cls.course}</p>
                              <p className="text-sm text-muted-foreground">{cls.time} • {cls.room}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{cls.students} students</Badge>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No classes scheduled</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedule.reduce((total, day) => total + day.classes.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedule.reduce((total, day) => total + (day.classes.length * 1.5), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Teaching hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedule.reduce((total, day) => total + day.classes.reduce((sum, cls) => sum + cls.students, 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
