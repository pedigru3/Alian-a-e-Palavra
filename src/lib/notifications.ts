// src/lib/notifications.ts
import { prisma } from './prisma';
import { messaging } from './firebase-admin';

/**
 * Sends a push notification to a user.
 */
export async function sendPushNotification(userId: string, title: string, body: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true, name: true }
  });

  if (!user?.pushToken || !messaging) {
    if (!messaging) {
      console.warn('[Push Notification] Messaging service not initialized.');
    } else {
      console.log(`[Push Notification] No token for user ${user?.name || userId}.`);
    }
    return;
  }

  try {
    const payload = {
      notification: { title, body },
      token: user.pushToken,
      // Opcional: Dados adicionais
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        status: 'done',
      }
    };

    const response = await messaging.send(payload);
    console.log(`[Push Notification] Successfully sent to ${user.name}:`, response);
  } catch (error) {
    console.error(`[Push Notification] Error sending to ${user.name}:`, error);
  }
}

/**
 * Notifies the partner that the user has completed their part of the devotional.
 */
export async function notifyPartnerCompletion(sessionId: string, currentUserId: string) {
  const session = await prisma.devotionalSession.findUnique({
    where: { id: sessionId },
    include: {
      template: true,
      couple: {
        include: {
          users: true
        }
      }
    }
  });

  if (!session) return;

  const currentUser = session.couple.users.find(u => u.id === currentUserId);
  const partner = session.couple.users.find(u => u.id !== currentUserId);

  if (partner && partner.pushToken) {
    const title = currentUser?.name || 'Seu parceiro';
    const body = `Acabei de terminar o devocional de hoje. Vem comigo?`;
    await sendPushNotification(partner.id, title, body);
  }
}
