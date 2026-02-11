T = int(input())                            # 전구의 갯수

light = list(map(int,input().split()))      # 전구의 꺼지고 켜짐

N = int(input())                            # 학생 수

for _ in range(N):
    gender, num = map(int,input().split())
    # 남자이면 num의 배수의 전구의 상태를 바꾼다.
    if gender == 1:
        for i in range(num-1, T, num):
            if light[i] == 1:
                light[i] = 0
            else:
                light[i] = 1

    elif gender == 2:
        is_same = True      # while문을 위해
        idx = 1             # 양쪽으로 점점 멀어지기 위해서 idx를 더하고 빼며 idx 값을 점점 키워 나감
        while(is_same == True):
            if 0<= num-1-idx and num-1+idx<T and light[num-1-idx] == light[num-1+idx]:   #범위가 0~ T 사이에서 양쪽이 서로 같을 때
                idx += 1
            else:
                is_same = False
        idx -= 1

        # 범위 안에 있는 전구의 상태를 변경
        for i in range(num-1-idx, num+idx):
            if light[i] == 1:
                light[i] = 0
            else:
                light[i] = 1
cnt=0
for i in range(T):
    cnt += 1
    print(f'{light[i]}',end=' ')
    if cnt %20 == 0:
        print()

