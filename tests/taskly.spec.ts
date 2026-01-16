import { test, expect } from '@playwright/test'

test.describe('Taskly App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display the app title', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Taskly')
  })

  test('should show empty state message when no tasks', async ({ page }) => {
    await expect(page.locator('.empty-message')).toHaveText('No tasks yet. Add one above!')
  })

  test.describe('Adding Tasks', () => {
    test('should add a new task', async ({ page }) => {
      const input = page.locator('.add-todo input')
      const addButton = page.locator('.add-todo button')

      await input.fill('Buy groceries')
      await addButton.click()

      await expect(page.locator('.todo-item')).toHaveCount(1)
      await expect(page.locator('.todo-item span')).toHaveText('Buy groceries')
    })

    test('should add a task by pressing Enter', async ({ page }) => {
      const input = page.locator('.add-todo input')

      await input.fill('Walk the dog')
      await input.press('Enter')

      await expect(page.locator('.todo-item')).toHaveCount(1)
      await expect(page.locator('.todo-item span')).toHaveText('Walk the dog')
    })

    test('should clear input after adding a task', async ({ page }) => {
      const input = page.locator('.add-todo input')

      await input.fill('Read a book')
      await input.press('Enter')

      await expect(input).toHaveValue('')
    })

    test('should not add empty tasks', async ({ page }) => {
      const addButton = page.locator('.add-todo button')

      await addButton.click()

      await expect(page.locator('.todo-item')).toHaveCount(0)
      await expect(page.locator('.empty-message')).toBeVisible()
    })

    test('should add multiple tasks', async ({ page }) => {
      const input = page.locator('.add-todo input')

      await input.fill('Task 1')
      await input.press('Enter')
      await input.fill('Task 2')
      await input.press('Enter')
      await input.fill('Task 3')
      await input.press('Enter')

      await expect(page.locator('.todo-item')).toHaveCount(3)
    })
  })

  test.describe('Completing Tasks', () => {
    test('should toggle task completion', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Complete me')
      await input.press('Enter')

      const checkbox = page.locator('.todo-item input[type="checkbox"]')
      await checkbox.click()

      await expect(page.locator('.todo-item')).toHaveClass(/completed/)
    })

    test('should uncheck completed task', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Toggle me')
      await input.press('Enter')

      const checkbox = page.locator('.todo-item input[type="checkbox"]')
      await checkbox.click()
      await expect(page.locator('.todo-item')).toHaveClass(/completed/)

      await checkbox.click()
      await expect(page.locator('.todo-item')).not.toHaveClass(/completed/)
    })
  })

  test.describe('Editing Tasks', () => {
    test('should edit a task using edit button', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Original text')
      await input.press('Enter')

      await page.locator('.todo-item .actions button:first-child').click()

      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('Updated text')
      await editInput.press('Enter')

      await expect(page.locator('.todo-item span')).toHaveText('Updated text')
    })

    test('should edit a task by double-clicking', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Double click me')
      await input.press('Enter')

      await page.locator('.todo-item span').dblclick()

      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('Edited by double click')
      await editInput.press('Enter')

      await expect(page.locator('.todo-item span')).toHaveText('Edited by double click')
    })

    test('should cancel edit with Escape key', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Do not change')
      await input.press('Enter')

      await page.locator('.todo-item .actions button:first-child').click()

      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('This should not save')
      await editInput.press('Escape')

      await expect(page.locator('.todo-item span')).toHaveText('Do not change')
    })
  })

  test.describe('Deleting Tasks', () => {
    test('should delete a task', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Delete me')
      await input.press('Enter')

      await expect(page.locator('.todo-item')).toHaveCount(1)

      await page.locator('.todo-item .actions button:last-child').click()

      await expect(page.locator('.todo-item')).toHaveCount(0)
      await expect(page.locator('.empty-message')).toBeVisible()
    })

    test('should delete correct task when multiple exist', async ({ page }) => {
      const input = page.locator('.add-todo input')

      await input.fill('Task A')
      await input.press('Enter')
      await input.fill('Task B')
      await input.press('Enter')
      await input.fill('Task C')
      await input.press('Enter')

      // Delete middle task (Task B)
      await page.locator('.todo-item:nth-child(2) .actions button:last-child').click()

      await expect(page.locator('.todo-item')).toHaveCount(2)
      await expect(page.locator('.todo-item:first-child span')).toHaveText('Task A')
      await expect(page.locator('.todo-item:last-child span')).toHaveText('Task C')
    })
  })

  test.describe('Stress Tests', () => {
    test('should handle adding 50 tasks', async ({ page }) => {
      const input = page.locator('.add-todo input')

      for (let i = 1; i <= 50; i++) {
        await input.fill(`Task number ${i}`)
        await input.press('Enter')
      }

      await expect(page.locator('.todo-item')).toHaveCount(50)
      await expect(page.locator('.todo-item:first-child span')).toHaveText('Task number 1')
      await expect(page.locator('.todo-item:last-child span')).toHaveText('Task number 50')
    })

    test('should handle adding and deleting many tasks rapidly', async ({ page }) => {
      const input = page.locator('.add-todo input')

      // Add 20 tasks
      for (let i = 1; i <= 20; i++) {
        await input.fill(`Rapid task ${i}`)
        await input.press('Enter')
      }

      await expect(page.locator('.todo-item')).toHaveCount(20)

      // Delete all tasks from first to last
      for (let i = 0; i < 20; i++) {
        await page.locator('.todo-item:first-child .actions button:last-child').click()
      }

      await expect(page.locator('.todo-item')).toHaveCount(0)
      await expect(page.locator('.empty-message')).toBeVisible()
    })

    test('should handle toggling many tasks complete/incomplete', async ({ page }) => {
      const input = page.locator('.add-todo input')

      // Add 10 tasks
      for (let i = 1; i <= 10; i++) {
        await input.fill(`Toggle task ${i}`)
        await input.press('Enter')
      }

      // Complete all tasks
      const checkboxes = page.locator('.todo-item input[type="checkbox"]')
      const count = await checkboxes.count()
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).click()
      }

      // Verify all are completed
      const items = page.locator('.todo-item')
      for (let i = 0; i < 10; i++) {
        await expect(items.nth(i)).toHaveClass(/completed/)
      }

      // Uncomplete all tasks
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).click()
      }

      // Verify none are completed
      for (let i = 0; i < 10; i++) {
        await expect(items.nth(i)).not.toHaveClass(/completed/)
      }
    })
  })

  test.describe('Edit Edge Cases', () => {
    test('should not save empty edit', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Original task')
      await input.press('Enter')

      await page.locator('.todo-item .actions button:first-child').click()

      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.press('Enter')

      // Should keep original text since empty is not valid
      await expect(page.locator('.todo-item span')).toHaveText('Original task')
    })

    test('should trim whitespace from edited task', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Trim test')
      await input.press('Enter')

      await page.locator('.todo-item .actions button:first-child').click()

      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('   Trimmed text   ')
      await editInput.press('Enter')

      await expect(page.locator('.todo-item span')).toHaveText('Trimmed text')
    })

    test('should not save whitespace-only edit', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Keep this')
      await input.press('Enter')

      await page.locator('.todo-item .actions button:first-child').click()

      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('     ')
      await editInput.press('Enter')

      // Should keep original since whitespace-only is not valid
      await expect(page.locator('.todo-item span')).toHaveText('Keep this')
    })

    test('should handle editing a completed task', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Complete then edit')
      await input.press('Enter')

      // Complete the task
      await page.locator('.todo-item input[type="checkbox"]').click()
      await expect(page.locator('.todo-item')).toHaveClass(/completed/)

      // Edit it
      await page.locator('.todo-item .actions button:first-child').click()
      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('Edited while complete')
      await editInput.press('Enter')

      // Should still be completed with new text
      await expect(page.locator('.todo-item')).toHaveClass(/completed/)
      await expect(page.locator('.todo-item span')).toHaveText('Edited while complete')
    })

    test('should handle very long task text', async ({ page }) => {
      const input = page.locator('.add-todo input')
      const longText = 'A'.repeat(500)
      await input.fill(longText)
      await input.press('Enter')

      await expect(page.locator('.todo-item span')).toHaveText(longText)

      // Edit to another long text
      await page.locator('.todo-item .actions button:first-child').click()
      const editInput = page.locator('.todo-item .edit-input')
      const newLongText = 'B'.repeat(500)
      await editInput.clear()
      await editInput.fill(newLongText)
      await editInput.press('Enter')

      await expect(page.locator('.todo-item span')).toHaveText(newLongText)
    })

    test('should handle special characters in task text', async ({ page }) => {
      const input = page.locator('.add-todo input')
      const specialText = '<script>alert("xss")</script> & "quotes" \'apostrophe\' < > /'
      await input.fill(specialText)
      await input.press('Enter')

      await expect(page.locator('.todo-item span')).toHaveText(specialText)
    })

    test('should handle unicode and emojis', async ({ page }) => {
      const input = page.locator('.add-todo input')
      const unicodeText = 'Task with emojis 🎉🚀💻 and unicode: café, naïve, 日本語'
      await input.fill(unicodeText)
      await input.press('Enter')

      await expect(page.locator('.todo-item span')).toHaveText(unicodeText)
    })

    test('should edit multiple tasks in sequence', async ({ page }) => {
      const input = page.locator('.add-todo input')

      await input.fill('First')
      await input.press('Enter')
      await input.fill('Second')
      await input.press('Enter')
      await input.fill('Third')
      await input.press('Enter')

      // Edit first task
      await page.locator('.todo-item:nth-child(1) .actions button:first-child').click()
      let editInput = page.locator('.todo-item:nth-child(1) .edit-input')
      await editInput.clear()
      await editInput.fill('First Edited')
      await editInput.press('Enter')

      // Edit second task
      await page.locator('.todo-item:nth-child(2) .actions button:first-child').click()
      editInput = page.locator('.todo-item:nth-child(2) .edit-input')
      await editInput.clear()
      await editInput.fill('Second Edited')
      await editInput.press('Enter')

      // Edit third task
      await page.locator('.todo-item:nth-child(3) .actions button:first-child').click()
      editInput = page.locator('.todo-item:nth-child(3) .edit-input')
      await editInput.clear()
      await editInput.fill('Third Edited')
      await editInput.press('Enter')

      await expect(page.locator('.todo-item:nth-child(1) span')).toHaveText('First Edited')
      await expect(page.locator('.todo-item:nth-child(2) span')).toHaveText('Second Edited')
      await expect(page.locator('.todo-item:nth-child(3) span')).toHaveText('Third Edited')
    })

    test('should save edit on blur', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Blur test')
      await input.press('Enter')

      await page.locator('.todo-item .actions button:first-child').click()

      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('Saved on blur')

      // Click outside to blur
      await page.locator('h1').click()

      await expect(page.locator('.todo-item span')).toHaveText('Saved on blur')
    })
  })

  test.describe('Delete Edge Cases', () => {
    test('should delete all tasks one by one from the end', async ({ page }) => {
      const input = page.locator('.add-todo input')

      for (let i = 1; i <= 5; i++) {
        await input.fill(`Task ${i}`)
        await input.press('Enter')
      }

      // Delete from last to first
      for (let i = 5; i >= 1; i--) {
        await page.locator('.todo-item:last-child .actions button:last-child').click()
        await expect(page.locator('.todo-item')).toHaveCount(i - 1)
      }

      await expect(page.locator('.empty-message')).toBeVisible()
    })

    test('should delete tasks in random order', async ({ page }) => {
      const input = page.locator('.add-todo input')

      await input.fill('A')
      await input.press('Enter')
      await input.fill('B')
      await input.press('Enter')
      await input.fill('C')
      await input.press('Enter')
      await input.fill('D')
      await input.press('Enter')
      await input.fill('E')
      await input.press('Enter')

      // Delete C (middle)
      await page.locator('.todo-item:nth-child(3) .actions button:last-child').click()
      await expect(page.locator('.todo-item')).toHaveCount(4)

      // Delete A (first)
      await page.locator('.todo-item:first-child .actions button:last-child').click()
      await expect(page.locator('.todo-item')).toHaveCount(3)

      // Delete E (last)
      await page.locator('.todo-item:last-child .actions button:last-child').click()
      await expect(page.locator('.todo-item')).toHaveCount(2)

      // Verify remaining tasks
      await expect(page.locator('.todo-item:nth-child(1) span')).toHaveText('B')
      await expect(page.locator('.todo-item:nth-child(2) span')).toHaveText('D')
    })

    test('should handle delete while task is completed', async ({ page }) => {
      const input = page.locator('.add-todo input')
      await input.fill('Complete then delete')
      await input.press('Enter')

      // Complete the task
      await page.locator('.todo-item input[type="checkbox"]').click()
      await expect(page.locator('.todo-item')).toHaveClass(/completed/)

      // Delete it
      await page.locator('.todo-item .actions button:last-child').click()

      await expect(page.locator('.todo-item')).toHaveCount(0)
    })

    test('should maintain task order after deleting middle tasks', async ({ page }) => {
      const input = page.locator('.add-todo input')

      for (let i = 1; i <= 10; i++) {
        await input.fill(`Task ${i}`)
        await input.press('Enter')
      }

      // Delete tasks 3, 5, 7 (keeping order perspective as we delete)
      await page.locator('.todo-item:nth-child(3) .actions button:last-child').click()
      await page.locator('.todo-item:nth-child(4) .actions button:last-child').click()
      await page.locator('.todo-item:nth-child(5) .actions button:last-child').click()

      await expect(page.locator('.todo-item')).toHaveCount(7)

      // Verify the remaining order
      await expect(page.locator('.todo-item:nth-child(1) span')).toHaveText('Task 1')
      await expect(page.locator('.todo-item:nth-child(2) span')).toHaveText('Task 2')
      await expect(page.locator('.todo-item:nth-child(3) span')).toHaveText('Task 4')
    })
  })

  test.describe('Combined Operations', () => {
    test('should handle add, complete, edit, delete in sequence', async ({ page }) => {
      const input = page.locator('.add-todo input')

      // Add
      await input.fill('Multi-op task')
      await input.press('Enter')
      await expect(page.locator('.todo-item')).toHaveCount(1)

      // Complete
      await page.locator('.todo-item input[type="checkbox"]').click()
      await expect(page.locator('.todo-item')).toHaveClass(/completed/)

      // Edit
      await page.locator('.todo-item .actions button:first-child').click()
      const editInput = page.locator('.todo-item .edit-input')
      await editInput.clear()
      await editInput.fill('Edited multi-op task')
      await editInput.press('Enter')
      await expect(page.locator('.todo-item span')).toHaveText('Edited multi-op task')
      await expect(page.locator('.todo-item')).toHaveClass(/completed/)

      // Delete
      await page.locator('.todo-item .actions button:last-child').click()
      await expect(page.locator('.todo-item')).toHaveCount(0)
    })

    test('should handle rapid add and immediate delete', async ({ page }) => {
      const input = page.locator('.add-todo input')

      for (let i = 0; i < 10; i++) {
        await input.fill(`Quick task ${i}`)
        await input.press('Enter')
        await page.locator('.todo-item:last-child .actions button:last-child').click()
      }

      await expect(page.locator('.todo-item')).toHaveCount(0)
    })

    test('should handle interleaved operations on multiple tasks', async ({ page }) => {
      const input = page.locator('.add-todo input')

      // Add 5 tasks
      for (let i = 1; i <= 5; i++) {
        await input.fill(`Task ${i}`)
        await input.press('Enter')
      }

      // Complete odd tasks (1, 3, 5)
      await page.locator('.todo-item:nth-child(1) input[type="checkbox"]').click()
      await page.locator('.todo-item:nth-child(3) input[type="checkbox"]').click()
      await page.locator('.todo-item:nth-child(5) input[type="checkbox"]').click()

      // Delete task 2
      await page.locator('.todo-item:nth-child(2) .actions button:last-child').click()

      // Edit task 4 (now at position 3)
      await page.locator('.todo-item:nth-child(3) .actions button:first-child').click()
      const editInput = page.locator('.todo-item:nth-child(3) .edit-input')
      await editInput.clear()
      await editInput.fill('Task 4 Edited')
      await editInput.press('Enter')

      await expect(page.locator('.todo-item')).toHaveCount(4)
      await expect(page.locator('.todo-item:nth-child(1)')).toHaveClass(/completed/)
      await expect(page.locator('.todo-item:nth-child(2)')).toHaveClass(/completed/)
      await expect(page.locator('.todo-item:nth-child(3) span')).toHaveText('Task 4 Edited')
      await expect(page.locator('.todo-item:nth-child(4)')).toHaveClass(/completed/)
    })
  })

  test.describe('Dark Mode', () => {
    test('should toggle dark mode', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle')

      // Should start in light mode
      await expect(page.locator('body')).not.toHaveClass(/dark/)

      // Click to enable dark mode
      await themeToggle.click()
      await expect(page.locator('body')).toHaveClass(/dark/)

      // Click to disable dark mode
      await themeToggle.click()
      await expect(page.locator('body')).not.toHaveClass(/dark/)
    })

    test('should persist dark mode preference', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle')

      // Enable dark mode
      await themeToggle.click()
      await expect(page.locator('body')).toHaveClass(/dark/)

      // Reload page
      await page.reload()

      // Should still be in dark mode
      await expect(page.locator('body')).toHaveClass(/dark/)
    })

    test('should show sun icon in dark mode and moon in light mode', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle')

      // Light mode should show moon
      await expect(themeToggle).toHaveText('🌙')

      // Dark mode should show sun
      await themeToggle.click()
      await expect(themeToggle).toHaveText('☀️')
    })
  })
})
