import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InputModalComponent } from './components/input-modal/input-modal.component';
import { config, filter, map, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'teamplanner';

  pairs: [number, number][] = [];
  
  get groupedPairs():  [string, [number, number][]][] {

    const groupedPairs = new Map<string, [number, number][]>();
    this.pairs.forEach(pair => {
      const key = pair.sort((a, b) => a < b ? -1 : 1).join('-');
      const value = groupedPairs.get(key) || [];
      value.push(pair);
      groupedPairs.set(key, value);
    });

    return [...groupedPairs.entries()].filter(x => x[1].length > 1).sort((a, b) => a[1].length < b[1].length ? 1 : -1);
  }

  schedule: Slot[] = [];

  get gridTemplateColumns(): string {
    if (this.schedule[0]?.games?.length) {
    return `repeat(${this.schedule[0]?.games?.length + 2}, 1fr)`;
    }
    return '';
  }

  get gamesCount(): [number, number][] {
    const teamMap = new Map<number, number>();
    this.schedule.forEach(slot => {
      slot.games.forEach(game => {
        if (game.home && game.guest){
          teamMap.set(game.home, teamMap.get(game.home) ? teamMap.get(game.home)! + 1 : 1);
          teamMap.set(game.guest, teamMap.get(game.guest) ? teamMap.get(game.guest)! + 1 : 1);
        }
      });
    });
    return [...teamMap.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
  }

  constructor(private dialog: MatDialog) {
    const storageSchedule = localStorage.getItem('schedule');
    if (storageSchedule) {
      const parsedSchedule = JSON.parse(storageSchedule) as Slot[];
      parsedSchedule.forEach(slot => {
        slot.games.forEach(game => {
          if (game.home && game.guest) {
            this.pairs.push([game.home, game.guest]);
          } else {
            game.home = undefined;
            game.guest = undefined;
          }
        });
      });
      this.schedule = parsedSchedule;
    }
  }

  getDoubleTeams(gameIndex: number): [number, number][] {
    const games = this.schedule.map(s => s.games[gameIndex]);
    const doubleTeams = new Map<number, number>();
    games.forEach(game => {
      if (game.home && game.guest){
        doubleTeams.set(game.home, doubleTeams.get(game.home) ? doubleTeams.get(game.home)! + 1 : 1);
        doubleTeams.set(game.guest, doubleTeams.get(game.guest) ? doubleTeams.get(game.guest)! + 1 : 1);
      }
    });
    return [...doubleTeams.entries()].filter(team => team[1] > 1).sort((a, b) => a[1] < b[1] ? 1 : -1).map(team => [team[0], team[1]]);
  }

  getTotalTeams(slot: Slot): number {
    const teams = new Set<number>();
    slot.games.forEach(game => {
      if (game.home && game.guest){
        teams.add(game.home);
        teams.add(game.guest);
      }
    });
    return teams.size;
  }

  saveToFile() {
    const blob = new Blob([JSON.stringify(this.schedule)], { type: 'text/json' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  openInput(): void {
    this.dialog.open(InputModalComponent, {
      width: '50%',
    }).afterClosed().pipe(
      tap(result => console.log(result)),
      filter(result => !!result)
    ).subscribe(result => {
      const teams = JSON.parse(result) as Slot[];
      this.schedule = teams;
      localStorage.setItem('schedule', result);
    });
  }

}

interface Game {
  home?: number;
  guest?: number;
}

interface Slot {
  time: string;
  games: Game[];
}

function randomIntFromInterval(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}
