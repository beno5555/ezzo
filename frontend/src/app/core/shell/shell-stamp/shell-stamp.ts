import { Component } from '@angular/core';

// The big "ezzo" stamped on the shell, behind every page but the landing page, which draws its own. Pure
// decoration: screen readers skip it, and the page's cards cover about half of it.
@Component({
  selector: 'app-shell-stamp',
  templateUrl: './shell-stamp.html',
})
export class ShellStamp {}
