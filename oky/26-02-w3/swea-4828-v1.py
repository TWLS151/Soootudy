# SWEA-4828 min max


T = int(input())

for test_case in range(1, T + 1):
    N = int(input())
    arr = list(map(int, input().split()))
    
    print(f'#{test_case} {max(arr) - min(arr)}')