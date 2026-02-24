import cron from 'node-cron';
import nodemailer from 'nodemailer';
import axios from 'axios';
import db from '../db/index.js';
import { differenceInDays, parseISO } from 'date-fns';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export function startCronJobs() {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily reminder cron job...');
    try {
      const users = db.prepare('SELECT * FROM users').all() as any[];
      
      for (const user of users) {
        const items = db.prepare('SELECT * FROM items WHERE user_id = ?').all(user.id) as any[];
        const today = new Date();
        
        const nearExpiryItems = items.filter(item => {
          const expirationDate = parseISO(item.expiration_date);
          const daysLeft = differenceInDays(expirationDate, today);
          return daysLeft >= 0 && daysLeft <= user.reminder_days;
        });

        const expiredItems = items.filter(item => {
          const expirationDate = parseISO(item.expiration_date);
          return differenceInDays(expirationDate, today) < 0;
        });

        const freshProduce = items.filter(item => ['蔬菜', '水果'].includes(item.category));
        
        // Send Email
        if (user.email && (nearExpiryItems.length > 0 || expiredItems.length > 0) && SMTP_HOST) {
          let emailHtml = `<h2>库存提醒</h2>`;
          if (nearExpiryItems.length > 0) {
            emailHtml += `<h3>临期物品 (未来 ${user.reminder_days} 天内过期):</h3><ul>`;
            nearExpiryItems.forEach(item => {
              emailHtml += `<li>${item.name} - 过期日期: ${item.expiration_date}</li>`;
            });
            emailHtml += `</ul>`;
          }
          if (expiredItems.length > 0) {
            emailHtml += `<h3>已过期物品:</h3><ul>`;
            expiredItems.forEach(item => {
              emailHtml += `<li>${item.name} - 过期日期: ${item.expiration_date}</li>`;
            });
            emailHtml += `</ul>`;
          }

          try {
            await transporter.sendMail({
              from: SMTP_USER,
              to: user.email,
              subject: '家庭库存管理 - 临期提醒',
              html: emailHtml,
            });
            console.log(`Sent email reminder to ${user.email}`);
          } catch (error) {
            console.error(`Failed to send email to ${user.email}`, error);
          }
        }

        // Send WeCom Message
        if (user.wecom_webhook) {
          let wecomMsg = `【家庭库存每日报告】\n\n`;
          
          if (freshProduce.length > 0) {
            wecomMsg += `🍎 生鲜果蔬库存:\n`;
            freshProduce.forEach(item => {
              wecomMsg += `- ${item.name}: ${item.weight || item.quantity} ${item.unit}\n`;
            });
            wecomMsg += `\n`;
          }

          if (nearExpiryItems.length > 0) {
            wecomMsg += `⚠️ 临期提醒 (未来 ${user.reminder_days} 天内):\n`;
            nearExpiryItems.forEach(item => {
              wecomMsg += `- ${item.name} (${item.expiration_date})\n`;
            });
            wecomMsg += `\n`;
          }

          if (expiredItems.length > 0) {
            wecomMsg += `❌ 已过期物品:\n`;
            expiredItems.forEach(item => {
              wecomMsg += `- ${item.name} (${item.expiration_date})\n`;
            });
          }

          if (freshProduce.length > 0 || nearExpiryItems.length > 0 || expiredItems.length > 0) {
            try {
              await axios.post(user.wecom_webhook, {
                msgtype: 'text',
                text: {
                  content: wecomMsg
                }
              });
              console.log(`Sent WeCom reminder to user ${user.username}`);
            } catch (error) {
              console.error(`Failed to send WeCom message to user ${user.username}`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in cron job', error);
    }
  });
}
