# IM 12기 기출
# BOJ-12927 배수 스위치


bulbs = list(input())
N = len(bulbs)

def on_off(arr, *n):
    for m in n:
        arr[m] = 'N' if arr[m] == 'Y' else 'Y'

click_cnt = 0

for i in range(N):
    if bulbs[i] == 'Y':
        on_off(bulbs, *[j for j in range(i, N, i + 1)])
        click_cnt += 1

print(click_cnt)
