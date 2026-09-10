/**
 * Seed Firestore emulator with 3 houses and sample data for UI testing.
 * Expects emulator on 127.0.0.1:8080.
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'demo',
  projectId: 'house-booking-calendar',
  appId: 'demo',
});
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function main() {
  const now = Timestamp.now();
  const houses = [];
  for (let i = 0; i < 3; i++) {
    const name = ['Домик 1', 'Домик 2', 'Домик 3'][i];
    const ref = await addDoc(collection(db, 'houses'), {
      name,
      createdAt: Timestamp.fromMillis(Date.now() + i * 1000),
    });
    houses.push({ id: ref.id, name });
    console.log('house', ref.id, name);
  }

  const h1 = houses[0].id;
  const h2 = houses[1].id;

  const start = new Date();
  start.setDate(15);
  start.setHours(14, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  end.setHours(11, 0, 0, 0);

  await addDoc(collection(db, 'bookings'), {
    name: 'Иван',
    phone: '+7 900 000-00-01',
    startDate: Timestamp.fromDate(start),
    endDate: Timestamp.fromDate(end),
    prepayment: 5000,
    finalPayment: 10000,
    comment: 'Тест дом 1',
    houseId: h1,
    createdAt: now,
  });

  const start2 = new Date(start);
  start2.setDate(20);
  const end2 = new Date(start2);
  end2.setDate(start2.getDate() + 1);
  end2.setHours(11, 0, 0, 0);

  await addDoc(collection(db, 'bookings'), {
    name: 'Мария',
    phone: '+7 900 000-00-02',
    startDate: Timestamp.fromDate(start2),
    endDate: Timestamp.fromDate(end2),
    prepayment: 3000,
    finalPayment: 7000,
    comment: 'Тест дом 2',
    houseId: h2,
    createdAt: now,
  });

  await addDoc(collection(db, 'expenses'), {
    name: 'Уборка дом 1',
    amount: 1500,
    date: now,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    createdAt: now,
    houseId: h1,
  });

  await addDoc(collection(db, 'expenses'), {
    name: 'Газ дом 2',
    amount: 800,
    date: now,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    createdAt: now,
    houseId: h2,
  });

  await addDoc(collection(db, 'todos'), {
    text: 'Починить кран (дом 1)',
    completed: false,
    createdAt: now,
    houseId: h1,
  });

  await addDoc(collection(db, 'todos'), {
    text: 'Поменять бельё (дом 2)',
    completed: true,
    createdAt: now,
    houseId: h2,
  });

  await addDoc(collection(db, 'reviews'), {
    name: 'Гость',
    rating: 5,
    text: 'Глобальный отзыв — одинаковый на всех домиках',
    createdAt: now,
    date: now,
  });

  console.log('Seed complete');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
