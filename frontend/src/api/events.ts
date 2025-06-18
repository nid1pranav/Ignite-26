import { apiClient } from './client'
import { Event, EventDay } from '@/types'

export interface CreateEventData {
  name: string
  description?: string
  startDate: string
  endDate: string
  eventDays: Array<{
    date: string
    fnEnabled?: boolean
    anEnabled?: boolean
    fnStartTime?: string
    fnEndTime?: string
    anStartTime?: string
    anEndTime?: string
  }>
}

export const eventsApi = {
  getEvents: async (): Promise<Event[]> => {
    return apiClient.get('/events')
  },

  getCurrentEvent: async (): Promise<{ event: Event; currentDay: EventDay | null }> => {
    return apiClient.get('/events/current')
  },

  getEvent: async (id: string): Promise<Event> => {
    return apiClient.get(`/events/${id}`)
  },

  createEvent: async (data: CreateEventData): Promise<Event> => {
    return apiClient.post('/events', data)
  },

  updateEvent: async (id: string, data: Partial<Omit<CreateEventData, 'eventDays'>>): Promise<Event> => {
    return apiClient.put(`/events/${id}`, data)
  },

  updateEventDay: async (dayId: string, data: Partial<EventDay>): Promise<EventDay> => {
    return apiClient.put(`/events/days/${dayId}`, data)
  },

  getEventDays: async (eventId: string): Promise<EventDay[]> => {
    return apiClient.get(`/events/${eventId}/days`)
  },

  deleteEvent: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/events/${id}`)
  },
}